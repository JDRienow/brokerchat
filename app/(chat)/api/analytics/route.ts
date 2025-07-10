import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getBrokerAnalytics,
  getPublicLinkAnalytics,
  getPublicLinkClientSessions,
  getBrokerPublicLinks,
} from '@/lib/db/queries';

// GET: Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('broker_id');
    const publicLinkId = searchParams.get('public_link_id');
    const days = Number.parseInt(searchParams.get('days') || '30');

    if (!brokerId && !publicLinkId) {
      return NextResponse.json(
        { error: 'Missing broker_id or public_link_id parameter' },
        { status: 400 },
      );
    }

    let analytics: any;
    let summary: any;

    if (brokerId) {
      // Get broker analytics
      analytics = await getBrokerAnalytics(brokerId, days);

      // Get summary data
      const publicLinks = await getBrokerPublicLinks(brokerId);
      const totalLinks = publicLinks.length;
      const activeLinks = publicLinks.filter((link) => link.is_active).length;

      // Calculate totals from analytics
      const totalViews = analytics.filter(
        (event: any) => event.event_type === 'link_view',
      ).length;
      const totalEmailCaptures = analytics.filter(
        (event: any) => event.event_type === 'email_capture',
      ).length;
      const totalMessages = analytics.filter(
        (event: any) => event.event_type === 'chat_message',
      ).length;

      summary = {
        totalLinks,
        activeLinks,
        totalViews,
        totalEmailCaptures,
        totalMessages,
      };
    } else if (publicLinkId) {
      // Get public link analytics
      analytics = await getPublicLinkAnalytics(publicLinkId, days);
      const clientSessions = await getPublicLinkClientSessions(publicLinkId);

      // Calculate totals
      const totalViews = analytics.filter(
        (event: any) => event.event_type === 'link_view',
      ).length;
      const totalEmailCaptures = analytics.filter(
        (event: any) => event.event_type === 'email_capture',
      ).length;
      const totalMessages = analytics.filter(
        (event: any) => event.event_type === 'chat_message',
      ).length;

      summary = {
        totalSessions: clientSessions.length,
        totalViews,
        totalEmailCaptures,
        totalMessages,
        clientSessions: clientSessions.slice(0, 10), // Return first 10 sessions
      };
    }

    return NextResponse.json({
      analytics,
      summary,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 },
    );
  }
}
