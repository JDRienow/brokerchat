'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { SubmitButton } from '@/components/submit-button';

import { forgotPassword, type ForgotPasswordActionState } from '../actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<
    ForgotPasswordActionState,
    FormData
  >(forgotPassword, {
    status: 'idle',
  });

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Failed to send reset email. Please try again.',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Please enter a valid email address.',
      });
    } else if (state.status === 'user_not_found') {
      toast({
        type: 'error',
        description: 'No account found with that email address.',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Password reset email sent! Check your inbox.',
      });
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  if (isSuccessful) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold dark:text-zinc-50">
              Email Sent!
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Check your inbox and click the link to reset your password.
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => setIsSuccessful(false)}
                className="text-blue-600 hover:underline"
              >
                try again
              </button>
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:underline dark:text-zinc-400"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Forgot Password?
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
        </div>
        <form
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 sm:px-16"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-900 dark:text-zinc-50"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              placeholder="Enter your email"
              type="email"
              autoComplete="email"
              required
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              defaultValue={email}
            />
          </div>
          <SubmitButton isSuccessful={isSuccessful}>
            Send Reset Link
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              ← Back to Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
