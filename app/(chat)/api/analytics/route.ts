import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getBrokerAnalytics,
  getTeamAnalytics,
  getPublicLinkAnalytics,
  getPublicLinkClientSessions,
  getBrokerPublicLinks,
  getTeamPublicLinksForAnalytics,
} from '@/lib/db/queries';

// GET: Get analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicLinkId = searchParams.get('public_link_id');
    const days = Number.parseInt(searchParams.get('days') || '30');

    let analytics: any;
    let summary: any;

    if (publicLinkId) {
      // Get public link analytics (unchanged)
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
    } else {
      // Get broker or team analytics
      if (session.user.team_id) {
        // Get team analytics
        analytics = await getTeamAnalytics(session.user.team_id, days);
        const publicLinks = await getTeamPublicLinksForAnalytics(
          session.user.team_id,
        );

        const totalLinks = publicLinks.length;
        const activeLinks = publicLinks.filter(
          (link: any) => link.is_active,
        ).length;

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
      } else {
        // Get individual broker analytics
        analytics = await getBrokerAnalytics(session.user.id, days);
        const publicLinks = await getBrokerPublicLinks(session.user.id);

        const totalLinks = publicLinks.length;
        const activeLinks = publicLinks.filter(
          (link: any) => link.is_active,
        ).length;

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
      }
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
