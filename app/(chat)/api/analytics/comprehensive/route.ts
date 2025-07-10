import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getComprehensiveBrokerAnalytics,
  getBrokerUsageStats,
  getAnalyticsTrends,
} from '@/lib/db/queries';

// GET: Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('broker_id');
    const days = Number.parseInt(searchParams.get('days') || '30');

    if (!brokerId) {
      return NextResponse.json(
        { error: 'Missing broker_id parameter' },
        { status: 400 },
      );
    }

    // Fetch all analytics data in parallel
    const [comprehensiveAnalytics, usageStats, trends] = await Promise.all([
      getComprehensiveBrokerAnalytics(brokerId, days),
      getBrokerUsageStats(brokerId),
      getAnalyticsTrends(brokerId, days),
    ]);

    return NextResponse.json({
      comprehensive: comprehensiveAnalytics,
      usage: usageStats,
      trends,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 },
    );
  }
}
