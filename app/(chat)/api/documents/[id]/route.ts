import { auth } from '@/app/(auth)/auth';
import { deleteDocumentAndRelatedData } from '@/lib/db/queries';
import type { NextRequest } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: 'Document ID is required' },
        { status: 400 },
      );
    }

    console.log(`Deleting document ${id} for user ${session.user.id}`);

    // Delete the document and all related data
    const result = await deleteDocumentAndRelatedData(id);

    return Response.json(result);
  } catch (error) {
    console.error('Error deleting document:', error);
    return Response.json(
      { error: 'Failed to delete document' },
      { status: 500 },
    );
  }
}
