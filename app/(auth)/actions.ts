'use server';

import { z } from 'zod';
import { hash } from 'bcrypt-ts';
import { nanoid } from 'nanoid';

import {
  createBroker,
  getBrokerByEmail,
  createPasswordResetToken,
  getBrokerByResetToken,
  clearPasswordResetToken,
  updateBrokerPassword,
  trackUserAction,
  trackPasswordResetAction,
  hasUsedTrial,
  supabaseAdmin,
} from '@/lib/db/queries';
import { sendPasswordResetEmail } from '@/lib/email';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const brokerRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  stripe_session_id: z.string().optional(),
  stripe_plan: z.string().optional(),
});

const preCheckoutSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  plan: z.string().min(1),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    // Check if signIn was successful
    if (result?.error) {
      console.error('SignIn error:', result.error);
      return { status: 'failed' };
    }

    // Track login analytics
    try {
      const broker = await getBrokerByEmail(validatedData.email);
      if (broker) {
        await trackUserAction(broker.id, 'login', {
          login_method: 'credentials',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (analyticsError) {
      console.error('Failed to track login analytics:', analyticsError);
    }

    return { status: 'success' };
  } catch (error) {
    console.error('Login action error:', error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface ForgotPasswordActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_not_found'
    | 'invalid_data';
}

export const forgotPassword = async (
  _: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> => {
  try {
    const email = formData.get('email') as string;
    if (!email) {
      return { status: 'invalid_data' };
    }

    const broker = await getBrokerByEmail(email);

    if (!broker) {
      return { status: 'user_not_found' };
    }

    // Generate reset token
    const resetToken = nanoid(32);
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiry

    await createPasswordResetToken(email, resetToken);

    // Send password reset email
    try {
      const brokerName = `${broker.first_name} ${broker.last_name}`.trim();
      await sendPasswordResetEmail(email, resetToken, brokerName);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // If email fails, we still return success to avoid revealing if email exists
      // but log the error for debugging
    }

    // Track password reset request analytics
    try {
      await trackPasswordResetAction(broker.id, 'request', {
        timestamp: new Date().toISOString(),
      });
    } catch (analyticsError) {
      console.error(
        'Failed to track password reset request analytics:',
        analyticsError,
      );
    }

    return { status: 'success' };
  } catch (error) {
    console.error('Forgot password action error:', error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface ResetPasswordActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_token'
    | 'invalid_data';
}

export const resetPassword = async (
  _: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> => {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token || !password || !confirmPassword) {
      return { status: 'invalid_data' };
    }

    if (password !== confirmPassword) {
      return { status: 'invalid_data' };
    }

    if (password.length < 6) {
      return { status: 'invalid_data' };
    }

    // Get broker by reset token
    const broker = await getBrokerByResetToken(token);

    if (!broker) {
      return { status: 'invalid_token' };
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update password and clear reset token
    await updateBrokerPassword(broker.id, hashedPassword);
    await clearPasswordResetToken(broker.id);

    // Track password reset completion
    try {
      await trackPasswordResetAction(broker.id, 'complete', {
        reset_method: 'email_token',
        timestamp: new Date().toISOString(),
      });
    } catch (analyticsError) {
      console.error(
        'Failed to track password reset analytics:',
        analyticsError,
      );
    }

    return { status: 'success' };
  } catch (error) {
    console.error('Reset password action error:', error);
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'trial_already_used'
    | 'email_banned'
    | 'invalid_data'
    | 'stripe_error';
}

export interface PreCheckoutActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
  checkoutUrl?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = brokerRegistrationSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      company_name: formData.get('company_name'),
      phone: formData.get('phone'),
    });

    // Get trial plan and Stripe data from form data
    const trialPlan = formData.get('trial_plan') as string;
    const stripeSessionId = formData.get('stripe_session_id') as string;
    const stripePlan = formData.get('stripe_plan') as string;

    const existingBroker = await getBrokerByEmail(validatedData.email);

    if (existingBroker) {
      return { status: 'user_exists' } as RegisterActionState;
    }

    // If this is a Stripe checkout flow, verify the session
    if (stripeSessionId && stripePlan) {
      try {
        const response = await fetch(
          `${process.env.NEXTAUTH_URL}/api/stripe/verify-session`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: stripeSessionId,
            }),
          },
        );

        if (!response.ok) {
          console.error(
            'Stripe session verification failed:',
            response.status,
            response.statusText,
          );
          return { status: 'stripe_error' } as RegisterActionState;
        }

        const sessionData = await response.json();

        if (
          !sessionData.valid ||
          sessionData.customer_email !== validatedData.email
        ) {
          console.error('Stripe session validation failed:', sessionData);
          return { status: 'stripe_error' } as RegisterActionState;
        }
      } catch (error) {
        console.error('Error verifying Stripe session:', error);
        return { status: 'stripe_error' } as RegisterActionState;
      }
    } else {
      // Only check banned emails for trial registrations (not paid subscriptions)
      const { data: bannedEmail } = await supabaseAdmin
        .from('banned_emails')
        .select('email, reason, banned_at')
        .eq('email', validatedData.email.toLowerCase())
        .single();

      if (bannedEmail) {
        console.log(
          `Trial registration blocked for banned email: ${validatedData.email}`,
        );
        return { status: 'email_banned' } as RegisterActionState;
      }

      // Check if this email has already used a trial (only for trial registrations)
      const trialUsed = await hasUsedTrial(validatedData.email);
      if (trialUsed) {
        return { status: 'trial_already_used' } as RegisterActionState;
      }
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create broker account based on registration type
    let newBroker: any;

    if (stripeSessionId && stripePlan) {
      // Create account with active subscription (no trial)
      newBroker = await createBroker({
        email: validatedData.email,
        password_hash: hashedPassword,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        company_name: validatedData.company_name,
        phone: validatedData.phone,
        subscription_tier: stripePlan,
        subscription_status: 'active', // Active subscription, no trial
        trial_ends_at: undefined, // No trial period
        has_used_trial: true, // Mark that this user has used their trial
      });
    } else {
      // Create account with trial
      const trialEndsAt = new Date();
      // Set trial to end exactly 14 days from now at the same time
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      newBroker = await createBroker({
        email: validatedData.email,
        password_hash: hashedPassword,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        company_name: validatedData.company_name,
        phone: validatedData.phone,
        subscription_tier: 'free_trial', // Use new clean tier name
        subscription_status: 'active', // Active trial
        trial_ends_at: trialEndsAt,
        has_used_trial: true, // Mark that this user has used their trial
      });
    }

    // Track registration analytics
    try {
      await trackUserAction(newBroker.id, 'registration', {
        registration_method: stripeSessionId ? 'stripe_checkout' : 'trial',
        trial_plan: trialPlan,
        stripe_plan: stripePlan,
        timestamp: new Date().toISOString(),
      });
    } catch (analyticsError) {
      console.error('Failed to track registration analytics:', analyticsError);
    }

    return { status: 'success' } as RegisterActionState;
  } catch (error) {
    console.error('Register action error:', error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' } as RegisterActionState;
    }

    return { status: 'failed' } as RegisterActionState;
  }
};

export const createPreCheckoutAccount = async (
  _: PreCheckoutActionState,
  formData: FormData,
): Promise<PreCheckoutActionState> => {
  try {
    const validatedData = preCheckoutSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      company_name: formData.get('company_name'),
      phone: formData.get('phone'),
      plan: formData.get('plan'),
    });

    // Check if user already exists
    const existingBroker = await getBrokerByEmail(validatedData.email);
    if (existingBroker) {
      return { status: 'user_exists' } as PreCheckoutActionState;
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create broker account with pending subscription status
    const newBroker = await createBroker({
      email: validatedData.email,
      password_hash: hashedPassword,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      company_name: validatedData.company_name,
      phone: validatedData.phone,
      subscription_tier: validatedData.plan,
      subscription_status: 'pending', // Will be activated after payment
      trial_ends_at: undefined,
      has_used_trial: true,
    });

    // Create Stripe checkout session
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/pre-checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: validatedData.plan,
            email: validatedData.email,
            userId: newBroker.id,
          }),
        },
      );

      if (!response.ok) {
        console.error(
          'Failed to create checkout session:',
          response.statusText,
        );
        return { status: 'failed' } as PreCheckoutActionState;
      }

      const { sessionId } = await response.json();

      // Track pre-checkout analytics
      try {
        await trackUserAction(newBroker.id, 'registration', {
          registration_method: 'pre_checkout',
          plan: validatedData.plan,
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error(
          'Failed to track pre-checkout analytics:',
          analyticsError,
        );
      }

      // Return success with checkout URL
      return {
        status: 'success',
        checkoutUrl: `/api/stripe/redirect-to-checkout?session_id=${sessionId}`,
      } as PreCheckoutActionState;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { status: 'failed' } as PreCheckoutActionState;
    }
  } catch (error) {
    console.error('Pre-checkout action error:', error);
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' } as PreCheckoutActionState;
    }

    return { status: 'failed' } as PreCheckoutActionState;
  }
};
