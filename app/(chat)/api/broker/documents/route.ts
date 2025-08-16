import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getBrokerDocuments, getTeamDocuments } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let documents: any[];

    // If user is on a team, get all team documents
    if (session.user.team_id) {
      documents = await getTeamDocuments(session.user.team_id);
    } else {
      // Otherwise, get only the user's documents
      documents = await getBrokerDocuments(session.user.id);
    }

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
