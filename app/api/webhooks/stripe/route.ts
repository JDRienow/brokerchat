import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe, getWebhookSecret } from '@/lib/stripe';
import {
  getBrokerByEmail,
  updateBrokerSubscription,
  supabaseAdmin,
  getTeamByAdminId,
  createTeam,
  updateBroker,
} from '@/lib/db/queries';
import { sendPasswordResetEmail } from '@/lib/email';
import { createPasswordResetToken } from '@/lib/db/queries';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  let event: any;

  try {
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    // This event fires when a checkout session is completed
    // For guest checkout, the customer is created here
    console.log(`Checkout session completed: ${session.id}`);

    // The customer and subscription will be created automatically by Stripe
    // We don't need to do anything here since we handle subscription events separately
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    // Don't throw - just log the error and continue
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const customer = (await stripe.customers.retrieve(
      subscription.customer as string,
    )) as any;
    console.log('Stripe webhook: handleSubscriptionCreated');
    console.log('Subscription object:', JSON.stringify(subscription, null, 2));
    console.log('Customer object:', JSON.stringify(customer, null, 2));

    // Check if this is a pre-checkout flow
    const isPreCheckout = subscription.metadata?.pre_checkout === 'true';
    const userId = subscription.metadata?.user_id;

    let broker: any;

    if (isPreCheckout && userId) {
      // For pre-checkout flow, get broker by user ID
      const { data: brokerData, error } = await supabaseAdmin
        .from('brokers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error finding pre-checkout broker:', error);
        return;
      }

      broker = brokerData;
      console.log('Pre-checkout broker found:', broker.email);
    } else {
      // For guest checkout, find by email
      broker = await getBrokerByEmail(customer.email || '');
      console.log('Guest checkout broker found:', !!broker);
    }

    // For guest checkout, create the broker account
    if (!broker) {
      console.log(
        `Creating broker account for guest checkout: ${customer.email}`,
      );

      // Create the broker account for guest checkout
      const { data: newBroker, error } = await supabaseAdmin
        .from('brokers')
        .insert({
          email: customer.email,
          first_name: customer.name?.split(' ')[0] || '',
          last_name: customer.name?.split(' ').slice(1).join(' ') || '',
          subscription_status: 'active',
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          subscription_tier: subscription.metadata?.plan_type || 'individual',
          trial_ends_at: null, // No trial for paid subscriptions
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating broker account in Supabase:', error);
        return;
      }

      console.log('Broker account created in Supabase:', newBroker);

      // Send setup link for the new account
      const setupToken = nanoid(32);
      await createPasswordResetToken(customer.email, setupToken);
      const brokerName =
        `${newBroker.first_name} ${newBroker.last_name}`.trim();
      await sendPasswordResetEmail(customer.email, setupToken, brokerName);
      console.log(`Created account and sent setup link to ${customer.email}`);
      return;
    }

    // For pre-checkout flow, update the existing account
    if (isPreCheckout) {
      await updateBrokerSubscription({
        brokerId: broker.id,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'active',
        trialEndsAt: null, // No trial for paid subscriptions
        currentPlan: subscription.metadata?.plan_type || 'individual',
      });

      console.log(
        `Pre-checkout subscription activated for broker: ${broker.email}`,
      );
      return;
    }

    // If broker exists and has no password, send setup link
    if (!broker.password_hash) {
      const setupToken = nanoid(32);
      await createPasswordResetToken(broker.email, setupToken);
      const brokerName = `${broker.first_name} ${broker.last_name}`.trim();
      await sendPasswordResetEmail(broker.email, setupToken, brokerName);
      console.log(`Sent setup link to ${broker.email}`);
    }

    // For existing users, update their subscription
    const currentPlan = subscription.metadata?.plan_type || 'individual';
    await updateBrokerSubscription({
      brokerId: broker.id,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'active',
      trialEndsAt: null, // No trial for paid subscriptions
      currentPlan,
    });

    // Team admin setup: if plan is team, ensure admin team exists and broker is admin
    if (currentPlan === 'team') {
      try {
        let team: any = null;
        try {
          team = await getTeamByAdminId(broker.id);
        } catch (e: any) {
          // PGRST116 means not found; create
          if (e?.code !== 'PGRST116') throw e;
        }
        if (!team) {
          const teamName =
            broker.company_name || `${broker.first_name || 'Team'}'s Team`;
          team = await createTeam(broker.id, teamName);
        }

        // Ensure broker flags are correct
        await updateBroker(broker.id, {
          is_team_admin: true as unknown as any,
          subscription_tier: 'team',
        } as any);
      } catch (adminErr) {
        console.error('Team admin ensure error (created):', adminErr);
      }
    }

    console.log(`Subscription created for existing broker: ${broker.email}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    // Don't throw - just log the error and continue
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const customer = (await stripe.customers.retrieve(
      subscription.customer as string,
    )) as any;

    // Find broker by email (simpler approach for direct updates)
    const broker = await getBrokerByEmail(customer.email || '');

    if (!broker) {
      console.log(
        `Broker not found for subscription update: ${subscription.id}. User may have been deleted.`,
      );
      return;
    }

    let status = 'active';
    if (subscription.status === 'trialing') {
      status = 'active'; // Use 'active' for trials instead of 'trial'
    } else if (subscription.status === 'canceled') {
      status = 'cancelled';
    } else if (subscription.status === 'past_due') {
      status = 'past_due';
    }

    const currentPlan = subscription.metadata?.plan_type || 'individual';
    await updateBrokerSubscription({
      brokerId: broker.id,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: status,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      currentPlan,
    });

    if (currentPlan === 'team' && status === 'active') {
      try {
        let team: any = null;
        try {
          team = await getTeamByAdminId(broker.id);
        } catch (e: any) {
          if (e?.code !== 'PGRST116') throw e;
        }
        if (!team) {
          const teamName =
            broker.company_name || `${broker.first_name || 'Team'}'s Team`;
          team = await createTeam(broker.id, teamName);
        }
        await updateBroker(broker.id, {
          is_team_admin: true as unknown as any,
          subscription_tier: 'team',
        } as any);
      } catch (adminErr) {
        console.error('Team admin ensure error (updated):', adminErr);
      }
    }

    console.log(
      `Subscription updated for broker ${broker.email}: ${subscription.id}`,
    );
  } catch (error) {
    console.error('Error handling subscription update:', error);
    // Don't throw - just log the error and continue
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const customer = (await stripe.customers.retrieve(
      subscription.customer as string,
    )) as any;
    const broker = await getBrokerByEmail(customer.email || '');

    if (!broker) {
      console.log(
        `Broker not found for subscription deletion: ${subscription.id}. User may have been deleted.`,
      );
      return;
    }

    await updateBrokerSubscription({
      brokerId: broker.id,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'cancelled',
      currentPlan: 'individual',
    });
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    // Don't throw - just log the error and continue
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const customer = (await stripe.customers.retrieve(
      invoice.customer as string,
    )) as any;
    const broker = await getBrokerByEmail(customer.email || '');

    if (!broker) {
      console.log(
        `Broker not found for payment success: ${invoice.id}. User may have been deleted.`,
      );
      return;
    }

    // Payment succeeded - subscription is now active
    await updateBrokerSubscription({
      brokerId: broker.id,
      subscriptionStatus: 'active',
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    // Don't throw - just log the error and continue
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const customer = (await stripe.customers.retrieve(
      invoice.customer as string,
    )) as any;
    const broker = await getBrokerByEmail(customer.email || '');

    if (!broker) {
      console.log(
        `Broker not found for payment failure: ${invoice.id}. User may have been deleted.`,
      );
      return;
    }

    // Payment failed - subscription is past due
    await updateBrokerSubscription({
      brokerId: broker.id,
      subscriptionStatus: 'past_due',
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
    // Don't throw - just log the error and continue
  }
}

async function handleTrialWillEnd(subscription: any) {
  try {
    const customer = (await stripe.customers.retrieve(
      subscription.customer as string,
    )) as any;
    const broker = await getBrokerByEmail(customer.email || '');

    if (!broker) {
      console.log(
        `Broker not found for trial ending: ${subscription.id}. User may have been deleted.`,
      );
      return;
    }

    // Send trial ending notification (you can implement email sending here)
    console.log(`Trial ending soon for broker: ${broker.email}`);
  } catch (error) {
    console.error('Error handling trial ending:', error);
    // Don't throw - just log the error and continue
  }
}

async function handleCustomerDeleted(customer: any) {
  try {
    console.log(`Customer deleted: ${customer.id}`);
    // Customer deletion doesn't necessarily mean we should delete the broker
    // The broker might still have an active subscription or want to keep their data
    // We'll just log this event for now
  } catch (error) {
    console.error('Error handling customer deleted:', error);
    // Don't throw - just log the error and continue
  }
}
