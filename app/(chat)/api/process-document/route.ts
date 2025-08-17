import { auth } from '@/app/(auth)/auth';
import {
  fetchDocumentMetadata,
  insertDocumentChunk,
  insertDocumentMetadataWithBroker,
  getBrokerDocuments,
  resolveOwnerBrokerIdForUser,
} from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import { uploadRateLimiter } from '@/lib/rate-limit-redis';

const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

// Configure route segment for larger payloads - Pro plan enabled
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Simple text chunking function
function chunkText(text: string, maxChunkSize = 1000): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence.trim();
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function getMaxDocumentsForTier(tier: string | undefined): number {
  switch (tier) {
    case 'team':
      return 200;
    case 'individual':
      return 25;
    case 'broker': // fallback for legacy
    case 'trial':
    default:
      return 5;
  }
}

// Create a dummy test file to avoid pdf-parse initialization issue
async function createDummyTestFile() {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const testDir = path.join(process.cwd(), 'test', 'data');
  const testFile = path.join(testDir, '05-versions-space.pdf');

  try {
    // Create directories if they don't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a minimal PDF file (not valid, but enough to prevent the error)
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, '%PDF-1.4\n%EOF');
    }
  } catch (error) {
    console.log('Could not create dummy test file:', error);
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await uploadRateLimiter(request);
  if (!rateLimitResult.success) {
    return Response.json(
      {
        error: 'Too many upload requests',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
        },
      },
    );
  }

  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ENFORCE DOCUMENT LIMITS
  const brokerId = await resolveOwnerBrokerIdForUser(session.user.id);
  const tier = session.user.subscription_tier;
  const docs = await getBrokerDocuments(brokerId);
  const maxDocs = getMaxDocumentsForTier(tier);
  if (docs.length >= maxDocs) {
    return Response.json(
      {
        error: `You have reached the maximum number of documents (${maxDocs}) for your plan.`,
      },
      { status: 403 },
    );
  }

  try {
    console.log('Processing document request...');

    // Log request details for debugging
    const contentLength = request.headers.get('content-length');
    console.log('Request content-length:', contentLength);

    // Create dummy test file before importing pdf-parse
    await createDummyTestFile();

    const contentType = request.headers.get('content-type');

    let file: File | null = null;
    let existingDocumentId: string | null = null;
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let fileType: string | null = null;

    if (contentType?.includes('application/json')) {
      // New Supabase Storage flow - receive file URL instead of file data
      console.log('Processing JSON request with Supabase Storage URL...');
      const body = await request.json();
      fileUrl = body.fileUrl;
      fileName = body.fileName;
      fileSize = body.fileSize;
      fileType = body.fileType;
      existingDocumentId = body.existingDocumentId;

      console.log('File details from Supabase Storage:', {
        url: fileUrl,
        name: fileName,
        size: fileSize,
        type: fileType,
      });

      // Check file size
      if (fileSize && fileSize > 100 * 1024 * 1024) {
        // 100MB limit for Supabase Storage
        console.log('File too large:', fileSize);
        return Response.json(
          { error: 'File too large. Maximum size is 100MB.' },
          { status: 413 },
        );
      }
    } else {
      // Legacy FormData flow (kept for compatibility)
      console.log('Attempting to parse form data...');
      const formData = await request.formData();
      file = formData.get('file') as File | null;
      existingDocumentId = formData.get('existingDocumentId') as string | null;

      if (file) {
        console.log('File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        // Check file size after receiving it
        if (file.size > 50 * 1024 * 1024) {
          console.log('File too large after parsing:', file.size);
          return Response.json(
            { error: 'File too large. Maximum size is 50MB.' },
            { status: 413 },
          );
        }
      }
    }

    let documentId: string;
    let title: string;
    let extractedText: string;

    if (file || fileUrl) {
      let pdfBuffer: Buffer;
      let actualFileName: string;

      if (fileUrl && fileName) {
        // New flow: Download file from Supabase Storage
        console.log('Downloading file from Supabase Storage:', fileUrl);
        title = fileName.replace('.pdf', '');
        actualFileName = fileName;

        try {
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          pdfBuffer = Buffer.from(arrayBuffer);
          console.log('Successfully downloaded file, size:', pdfBuffer.length);
        } catch (error) {
          console.error('Error downloading file from storage:', error);
          return Response.json(
            {
              error: 'Failed to download file from storage',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
          );
        }
      } else if (file) {
        // Legacy flow: Use uploaded file directly
        console.log('Processing uploaded file:', file.name);
        title = file.name.replace('.pdf', '');
        actualFileName = file.name;

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      } else {
        return Response.json(
          { error: 'No file or file URL provided' },
          { status: 400 },
        );
      }

      // Extract text from PDF (same for both flows)
      console.log('Extracting text from PDF...');
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;
        console.log(
          'Successfully extracted text, length:',
          extractedText.length,
        );
      } catch (error) {
        console.error('PDF parsing error:', error);
        return Response.json(
          {
            error: 'Failed to extract text from PDF',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 },
        );
      }

      // Insert document metadata and get the generated ID
      console.log('Inserting document metadata...');
      try {
        const metadata = await insertDocumentMetadataWithBroker(
          title,
          actualFileName,
          brokerId,
          fileUrl || undefined, // Pass storage URL if available
        );
        console.log('Metadata result:', metadata);

        if (!metadata || !metadata.id) {
          throw new Error('insertDocumentMetadataWithBroker returned no data');
        }

        documentId = metadata.id;
        console.log('Generated document ID:', documentId);
      } catch (error) {
        console.error('Document metadata insertion error:', error);
        return Response.json(
          {
            error: 'Failed to save document metadata',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 },
        );
      }
    } else if (existingDocumentId) {
      // Process existing document
      console.log('Processing existing document:', existingDocumentId);
      const document = await fetchDocumentMetadata(existingDocumentId);

      if (!document) {
        return Response.json({ error: 'Document not found' }, { status: 404 });
      }

      documentId = existingDocumentId;
      title = document.title;

      // For existing documents, we need to fetch the original PDF content
      // This is a placeholder - in a real implementation, you'd store the original PDF
      extractedText =
        'This is sample text from the existing document. In a real implementation, you would retrieve the original PDF content and extract text from it.';

      console.log('Using placeholder text for existing document');
    } else {
      return Response.json(
        { error: 'No file, file URL, or document ID provided' },
        { status: 400 },
      );
    }

    console.log('Chunking text...');
    const chunks = chunkText(extractedText);
    console.log('Created', chunks.length, 'text chunks');

    let successCount = 0;
    let errorCount = 0;

    console.log('Processing chunks with embeddings...');
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);

        // Generate embedding for chunk
        const embeddingResponse = await fetch(
          'https://api.openai.com/v1/embeddings',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: OPENAI_EMBEDDING_MODEL,
              input: chunk,
            }),
          },
        );

        if (!embeddingResponse.ok) {
          throw new Error(`Embedding API error: ${embeddingResponse.status}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Store chunk in database with proper parameters
        await insertDocumentChunk(
          documentId,
          chunk,
          embedding,
          i, // chunk_index
          {
            // metadata
            user_id: brokerId,
            processed_at: new Date().toISOString(),
          },
        );
        successCount++;

        console.log(`Successfully processed chunk ${i + 1}`);
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log(
      `Processing complete. Success: ${successCount}, Errors: ${errorCount}`,
    );

    return Response.json({
      success: true,
      message: `Successfully processed ${successCount} out of ${chunks.length} text chunks`,
      chunks: successCount,
      documentId,
      title,
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return Response.json(
      {
        error: 'Internal server error during document processing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
