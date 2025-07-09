import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  createPublicLink,
  getBrokerPublicLinks,
  updatePublicLink,
  deletePublicLink,
  trackAnalyticsEvent,
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

    // Create the public link
    const publicLink = await createPublicLink({
      document_id,
      broker_id,
      title,
      description,
      requires_email,
      custom_branding,
    });

    // Track analytics event
    await trackAnalyticsEvent({
      broker_id,
      public_link_id: publicLink.id,
      event_type: 'link_view',
      event_data: { action: 'created' },
    });

    return NextResponse.json(publicLink, { status: 201 });
  } catch (error) {
    console.error('Error creating public link:', error);
    return NextResponse.json(
      { error: 'Failed to create public link' },
      { status: 500 },
    );
  }
}

// GET: Get broker's public links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('broker_id');

    if (!brokerId) {
      return NextResponse.json(
        { error: 'Missing broker_id parameter' },
        { status: 400 },
      );
    }

    const publicLinks = await getBrokerPublicLinks(brokerId);
    return NextResponse.json(publicLinks);
  } catch (error) {
    console.error('Error fetching public links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public links' },
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

    if (!id) {
      return NextResponse.json(
        { error: 'Missing public link id' },
        { status: 400 },
      );
    }

    await deletePublicLink(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting public link:', error);
    return NextResponse.json(
      { error: 'Failed to delete public link' },
      { status: 500 },
    );
  }
}
