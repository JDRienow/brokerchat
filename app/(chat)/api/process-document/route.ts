import { auth } from '@/app/(auth)/auth';
import {
  fetchDocumentMetadata,
  insertDocumentChunk,
  insertDocumentMetadataWithBroker,
} from '@/lib/db/queries';
import type { NextRequest } from 'next/server';

const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

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
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Processing document request...');

    // Log request details for debugging
    const contentLength = request.headers.get('content-length');
    console.log('Request content-length:', contentLength);

    if (contentLength && Number.parseInt(contentLength) > 15 * 1024 * 1024) {
      console.log('Request too large, content-length:', contentLength);
      return Response.json(
        { error: 'File too large. Maximum size is 15MB.' },
        { status: 413 },
      );
    }

    // Create dummy test file before importing pdf-parse
    await createDummyTestFile();

    console.log('Attempting to parse form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
    const existingDocumentId = formData.get('existingDocumentId') as
      | string
      | null;

    let documentId: string;
    let title: string;
    let extractedText: string;

    if (file) {
      // Process uploaded file
      console.log('Processing uploaded file:', file.name);
      title = file.name.replace('.pdf', '');

      // Read file buffer
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // Extract text from PDF
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
          file.name,
          session.user.id,
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
        { error: 'No file or document ID provided' },
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
            user_id: session.user.id,
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
