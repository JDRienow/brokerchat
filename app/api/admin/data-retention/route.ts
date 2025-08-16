import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  runDataRetentionCleanup,
  getStorageStats,
  getRetentionConfig,
} from '@/lib/data-retention';

// Helper function to validate admin credentials
async function validateAdminAccess(request: Request): Promise<boolean> {
  try {
    // First try session authentication
    const session = await auth();
    if (session?.user && session.user.type === 'broker') {
      return true;
    }

    // If no session, check for admin credentials in headers (for local testing)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return false;
    }

    // Check if request has admin credentials in headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    // Decode Basic auth
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [email, password] = credentials.split(':');

    return email === adminEmail && password === adminPassword;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

// GET: Get storage statistics and retention configuration
export async function GET(request: Request) {
  try {
    console.log('Admin API: Validating access...');
    const isAuthorized = await validateAdminAccess(request);

    if (!isAuthorized) {
      console.log('Admin API: Access denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Admin API: Access granted, getting storage stats...');

    // Get storage statistics
    const stats = await getStorageStats();
    console.log('Admin API: Got storage stats:', stats);

    const config = getRetentionConfig();
    console.log('Admin API: Got retention config:', config);

    return NextResponse.json({
      success: true,
      stats,
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin API: Error getting storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get storage statistics', details: String(error) },
      { status: 500 },
    );
  }
}

// POST: Run data retention cleanup
export async function POST(request: Request) {
  try {
    const isAuthorized = await validateAdminAccess(request);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the cleanup
    const results = await runDataRetentionCleanup();

    return NextResponse.json({
      success: results.success,
      results: results.results,
      totalDeleted: results.totalDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running data retention cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to run data retention cleanup' },
      { status: 500 },
    );
  }
}
