import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/db/queries';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Stripe subscription ID directly from the database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('brokers')
      .select(
        'stripe_subscription_id, stripe_customer_id, email, team_id, is_team_admin',
      )
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 },
      );
    }

    // Only team admins can cancel when part of a team
    if (userData?.team_id && !userData?.is_team_admin) {
      return NextResponse.json(
        { error: 'Only the team admin can manage the team subscription' },
        { status: 403 },
      );
    }

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 },
      );
    }

    // Cancel the subscription in Stripe immediately (since we're deleting the account)
    const subscription = await stripe.subscriptions.cancel(
      userData.stripe_subscription_id,
    );

    // Ban the user's email to prevent future signups
    await banUserEmail(
      session.user.id,
      userData.email,
      userData.stripe_customer_id,
      userData.stripe_subscription_id,
    );

    // Delete all user data (documents, public links, analytics, etc.)
    await deleteUserData(session.user.id);

    // Delete the user account completely
    await deleteUserAccount(session.user.id);

    return NextResponse.json({
      success: true,
      message:
        'Subscription cancelled successfully. Your account has been deleted.',
      redirect: '/', // Redirect to landing page
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at: subscription.cancel_at,
      },
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 },
    );
  }
}

async function banUserEmail(
  userId: string,
  email: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
) {
  try {
    console.log(`Banning email from free trials: ${email}`);

    // Insert the email into the banned_emails table
    const { error } = await supabaseAdmin.from('banned_emails').insert({
      email: email.toLowerCase(),
      original_broker_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      reason: 'subscription_cancelled',
      metadata: {
        cancelled_at: new Date().toISOString(),
        original_user_id: userId,
        restriction: 'free_trial_only', // Only prevents free trial access
        can_signup_paid: true, // Can still sign up for paid plans
      },
    });

    if (error) {
      console.error('Error banning email:', error);
      throw error;
    }

    console.log(`Successfully banned email from free trials: ${email}`);
  } catch (error) {
    console.error('Error banning user email:', error);
    // Don't throw here as we don't want to fail the cancellation if banning fails
  }
}

async function deleteUserData(userId: string) {
  try {
    console.log(`Deleting all data for user: ${userId}`);

    // Get all documents for this user
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('document_metadata')
      .select('id')
      .eq('broker_id', userId);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return;
    }

    if (documents && documents.length > 0) {
      const documentIds = documents.map((doc) => doc.id);

      // Delete all document chunks
      for (const docId of documentIds) {
        await supabaseAdmin.from('documents').delete().eq('file_id', docId);
      }

      // Delete all public links
      await supabaseAdmin.from('public_links').delete().eq('broker_id', userId);

      // Delete all client sessions
      await supabaseAdmin
        .from('client_sessions')
        .delete()
        .eq('broker_id', userId);

      // Delete all chat histories
      await supabaseAdmin
        .from('chat_histories')
        .delete()
        .eq('broker_id', userId);

      // Delete all analytics events
      await supabaseAdmin.from('analytics').delete().eq('broker_id', userId);

      // Delete all document metadata
      await supabaseAdmin
        .from('document_metadata')
        .delete()
        .eq('broker_id', userId);
    }

    console.log(`Successfully deleted all data for user: ${userId}`);
  } catch (error) {
    console.error('Error deleting user data:', error);
    // Don't throw here as we don't want to fail the cancellation if data deletion fails
  }
}

async function deleteUserAccount(userId: string) {
  try {
    console.log(`Deleting user account: ${userId}`);

    // Delete the user from the brokers table
    const { error } = await supabaseAdmin
      .from('brokers')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }

    console.log(`Successfully deleted user account: ${userId}`);
  } catch (error) {
    console.error('Error deleting user account:', error);
    // Don't throw here as we don't want to fail the cancellation if account deletion fails
  }
}
