'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import Image from 'next/image';
import { Suspense } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';
import { useSession } from 'next-auth/react';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      updateSession();

      // If user was redirected here for checkout, redirect them to dashboard with checkout params
      if (redirect === 'checkout' && plan) {
        setTimeout(() => {
          router.push(`/dashboard?checkout_plan=${plan}`);
        }, 1000);
      } else {
        router.refresh();
      }
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat"
            width={160}
            height={40}
            className="h-12 w-auto"
          />
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {plan && redirect === 'checkout'
              ? `Sign in to complete your ${plan} plan purchase`
              : 'Use your email and password to sign in'}
          </p>
          {plan && redirect === 'checkout' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800 text-center">
                🛒 <strong>Purchase in progress:</strong>{' '}
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
              </p>
            </div>
          )}
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-600 hover:underline dark:text-zinc-400"
            >
              Forgot password?
            </Link>
          </div>
          <div className="text-center mt-2">
            <Link
              href="/setup-account"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Need to set up your account after purchase?
            </Link>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
