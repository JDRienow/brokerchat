import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchDocumentMetadata } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('id');

  if (!documentId) {
    return NextResponse.json(
      { error: 'Document ID is required' },
      { status: 400 },
    );
  }

  try {
    const document = await fetchDocumentMetadata(documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Fix the document URL - files in public directory are served from root
    const documentWithFixedUrl = {
      ...document,
      url: document.url || '#',
    };

    return NextResponse.json(documentWithFixedUrl);
  } catch (error) {
    console.error('Error fetching document metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
