import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await auth();

    // Parse the error data
    const errorData = await request.json();

    // Add user information if available
    const enrichedErrorData = {
      ...errorData,
      userId: session?.user?.id || 'anonymous',
      userEmail: session?.user?.email || 'anonymous',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', enrichedErrorData);
    }

    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, or your own logging service

    // For now, we'll log to a file or database
    // You can implement your preferred logging solution here

    // Example: Log to Supabase
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        );

        await supabase.from('error_logs').insert([
          {
            user_id: enrichedErrorData.userId,
            user_email: enrichedErrorData.userEmail,
            error_message: enrichedErrorData.error,
            error_stack: enrichedErrorData.stack,
            component_stack: enrichedErrorData.componentStack,
            url: enrichedErrorData.url,
            user_agent: enrichedErrorData.userAgent,
            environment: enrichedErrorData.environment,
            timestamp: enrichedErrorData.timestamp,
          },
        ]);
      } catch (dbError) {
        console.error('Failed to log error to database:', dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in error logging endpoint:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
