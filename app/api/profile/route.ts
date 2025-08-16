import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getBrokerByEmail } from '@/lib/db/queries';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch fresh data from database
    const broker = await getBrokerByEmail(session.user.email);

    if (!broker) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: broker.id,
        email: broker.email,
        first_name: broker.first_name,
        last_name: broker.last_name,
        company_name: broker.company_name,
        subscription_tier: broker.subscription_tier,
        subscription_status: broker.subscription_status,
        trial_ends_at: broker.trial_ends_at,
        logo_url: broker.logo_url,
        team_id: broker.team_id,
        is_team_admin: broker.is_team_admin,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { first_name, last_name, company_name, logo_url } = body;

    // Validate input
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 },
      );
    }

    // Update the broker profile
    const { data, error } = await supabase
      .from('brokers')
      .update({
        first_name,
        last_name,
        company_name: company_name || '',
        logo_url: logo_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        subscription_tier: data.subscription_tier,
        subscription_status: data.subscription_status,
        trial_ends_at: data.trial_ends_at,
        logo_url: data.logo_url,
        team_id: data.team_id,
        is_team_admin: data.is_team_admin,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
