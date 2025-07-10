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

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

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

    // Validate email
    const emailSchema = z.string().email();
    const validatedEmail = emailSchema.parse(email);

    // Check if broker exists
    const broker = await getBrokerByEmail(validatedEmail);
    if (!broker) {
      return { status: 'user_not_found' };
    }

    // Generate reset token
    const resetToken = nanoid(32);

    // Save reset token to database
    await createPasswordResetToken(validatedEmail, resetToken);

    // Send password reset email
    try {
      const brokerName = `${broker.first_name} ${broker.last_name}`.trim();
      await sendPasswordResetEmail(validatedEmail, resetToken, brokerName);
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
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    console.error('Forgot password error:', error);
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

    // Validate input
    const schema = z.object({
      token: z.string().min(1, 'Token is required'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      confirmPassword: z.string().min(6, 'Password confirmation is required'),
    });

    const validatedData = schema.parse({
      token,
      password,
      confirmPassword,
    });

    // Check if passwords match
    if (validatedData.password !== validatedData.confirmPassword) {
      return { status: 'invalid_data' };
    }

    // Verify reset token
    const broker = await getBrokerByResetToken(validatedData.token);
    if (!broker) {
      return { status: 'invalid_token' };
    }

    // Hash new password
    const hashedPassword = await hash(validatedData.password, 10);

    // Update password and clear reset token
    await Promise.all([
      updateBrokerPassword(broker.id, hashedPassword),
      clearPasswordResetToken(broker.id),
    ]);

    // Track password reset completion analytics
    try {
      await trackPasswordResetAction(broker.id, 'complete', {
        timestamp: new Date().toISOString(),
      });
    } catch (analyticsError) {
      console.error(
        'Failed to track password reset completion analytics:',
        analyticsError,
      );
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    console.error('Reset password error:', error);
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
    | 'invalid_data';
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

    const existingBroker = await getBrokerByEmail(validatedData.email);

    if (existingBroker) {
      return { status: 'user_exists' } as RegisterActionState;
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create broker account
    const newBroker = await createBroker({
      email: validatedData.email,
      password_hash: hashedPassword,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      company_name: validatedData.company_name,
      phone: validatedData.phone,
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    // Track registration analytics
    try {
      await trackUserAction(newBroker.id, 'registration', {
        registration_method: 'email',
        has_company: !!validatedData.company_name,
        has_phone: !!validatedData.phone,
        timestamp: new Date().toISOString(),
      });
    } catch (analyticsError) {
      console.error('Failed to track registration analytics:', analyticsError);
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
