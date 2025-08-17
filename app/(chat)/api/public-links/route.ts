import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  createPublicLink,
  getBrokerPublicLinks,
  getTeamPublicLinks,
  updatePublicLink,
  deletePublicLink,
  trackAnalyticsEventSafely,
  resolveOwnerBrokerIdForUser,
} from '@/lib/db/queries';

// POST: Create a new public link
export async function POST(request: NextRequest) {
  try {
    const {
      document_id,
      broker_id,
      title,
      description,
      requires_email = true,
      custom_branding,
    } = await request.json();

    if (!document_id || !broker_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: document_id, broker_id, title' },
        { status: 400 },
      );
    }

    // Force ownership to the admin broker for team accounts
    const ownerBrokerId = await resolveOwnerBrokerIdForUser(broker_id);

    // Create the public link owned by the admin broker
    const publicLink = await createPublicLink({
      document_id,
      broker_id: ownerBrokerId,
      title,
      description,
      requires_email,
      custom_branding,
    });

    // Track analytics event
    await trackAnalyticsEventSafely({
      broker_id: ownerBrokerId,
      public_link_id: publicLink.id,
      event_type: 'link_view',
      event_data: { action: 'created' },
    });

    return NextResponse.json(publicLink, { status: 201 });
  } catch (error) {
    console.error('Error creating public link:', error);

    // Check if it's a duplicate link error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }, // Conflict status code
      );
    }

    return NextResponse.json(
      { error: 'Failed to create public link' },
      { status: 500 },
    );
  }
}

// GET: Get broker's public links
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let publicLinksRaw: any[];

    // If user is on a team, get all team public links
    if (session.user.team_id) {
      publicLinksRaw = await getTeamPublicLinks(session.user.team_id);
    } else {
      // Otherwise, get only the user's public links
      publicLinksRaw = await getBrokerPublicLinks(session.user.id);
    }

    // Transform the data to match dashboard expectations
    const publicLinks = publicLinksRaw.map((link) => ({
      id: link.id,
      document_id: link.document_id, // Include document_id for proper matching
      token: link.public_token,
      title: link.title,
      description: link.description,
      is_active: link.is_active,
      requires_email: link.requires_email,
      created_at: link.created_at,
      view_count: link.client_sessions?.[0]?.count || 0,
      unique_visitors: link.client_sessions?.[0]?.count || 0, // For now, use same as view_count
      document_title: link.document_metadata?.title || 'Unknown Document',
    }));

    return NextResponse.json({ links: publicLinks });
  } catch (error) {
    console.error('Error fetching public links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT: Update a public link
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing public link id' },
        { status: 400 },
      );
    }

    const updatedLink = await updatePublicLink(id, updates);
    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Error updating public link:', error);
    return NextResponse.json(
      { error: 'Failed to update public link' },
      { status: 500 },
    );
  }
}

// DELETE: Delete a public link
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const brokerId = searchParams.get('broker_id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing public link id' },
        { status: 400 },
      );
    }

    if (!brokerId) {
      return NextResponse.json(
        { error: 'Missing broker_id parameter' },
        { status: 400 },
      );
    }

    await deletePublicLink(id);

    // Track analytics event
    await trackAnalyticsEventSafely({
      broker_id: brokerId,
      public_link_id: id,
      event_type: 'public_link_delete',
      event_data: { action: 'deleted' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting public link:', error);
    return NextResponse.json(
      { error: 'Failed to delete public link' },
      { status: 500 },
    );
  }
}
