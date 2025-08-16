'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState, Suspense } from 'react';
import { toast } from '@/components/toast';
import Image from 'next/image';

import { SubmitButton } from '@/components/submit-button';

import { resetPassword, type ResetPasswordActionState } from '../actions';

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<
    ResetPasswordActionState,
    FormData
  >(resetPassword, {
    status: 'idle',
  });

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Failed to reset password. Please try again.',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Please check your input and try again.',
      });
    } else if (state.status === 'invalid_token') {
      toast({
        type: 'error',
        description:
          'Invalid or expired reset token. Please request a new one.',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Password reset successfully!',
      });
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state.status, router]);

  // If no token, redirect to forgot password
  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
    }
  }, [token, router]);

  const handleSubmit = (formData: FormData) => {
    // Add the token to the form data
    formData.append('token', token || '');
    formAction(formData);
  };

  if (!token) {
    return null; // Will redirect
  }

  if (isSuccessful) {
    return (
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
            <Image
              src="/images/om2chat (400 x 100 px).svg"
              alt="OM2Chat"
              width={400}
              height={100}
              className="h-12 w-auto"
            />
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
              Password Reset!
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Your password has been successfully reset. You will be redirected
              to the login page shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
          <Image
            src="/images/om2chat (400 x 100 px).svg"
            alt="OM2Chat"
            width={400}
            height={100}
            className="h-12 w-auto"
          />
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Reset Password
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your new password below
          </p>
        </div>
        <form
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 sm:px-16"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-900 dark:text-zinc-50"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              placeholder="Enter new password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-900 dark:text-zinc-50"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
          </div>
          <SubmitButton isSuccessful={isSuccessful}>
            Reset Password
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

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
