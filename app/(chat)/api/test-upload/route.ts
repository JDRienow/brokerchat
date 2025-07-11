import type { NextRequest } from 'next/server';

// Configure route segment for larger payloads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    console.log('Test upload endpoint called');

    const contentLength = request.headers.get('content-length');
    console.log('Content-Length:', contentLength);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2),
    });

    return Response.json({
      success: true,
      message: 'File upload test successful',
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Test upload error:', error);
    return Response.json(
      {
        error: 'Test upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
