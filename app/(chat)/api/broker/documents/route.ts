import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getBrokerDocuments } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brokerId = session.user.id;
    const documents = await getBrokerDocuments(brokerId);

    return NextResponse.json({
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        url: doc.url || '#',
        created_at: doc.created_at,
        chunk_count: doc.chunk_count || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching broker documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
