'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import Image from 'next/image';
import { SubmitButton } from '@/components/submit-button';
import {
  createPreCheckoutAccount,
  type PreCheckoutActionState,
} from '../actions';
import { toast } from '@/components/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';

function PreCheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const { data: session } = useSession();

  const [state, formAction] = useActionState<PreCheckoutActionState, FormData>(
    createPreCheckoutAccount,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({
        type: 'error',
        description: 'Account already exists! Please sign in instead.',
      });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Please check your information and try again.',
      });
    } else if (state.status === 'success' && state.checkoutUrl) {
      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Account created! Redirecting to checkout...',
      });

      // Redirect to Stripe Checkout
      setTimeout(() => {
        if (state.checkoutUrl) {
          window.location.href = state.checkoutUrl;
        }
      }, 1500);
    }
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    formAction(formData);
  };

  if (!plan || !['individual', 'team'].includes(plan)) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Invalid Plan</h2>
          <p className="text-gray-600 mb-4">
            Please select a valid plan to continue.
          </p>
          <Link href="/pricing" className="text-blue-600 hover:underline">
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header with proper spacing */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo and header section */}
          <div className="flex flex-col items-center justify-center gap-6 mb-8">
            <Image
              src="/images/om2chat-logo.svg"
              alt="OM2Chat"
              width={160}
              height={40}
              className="h-12 w-auto"
            />
            <div className="text-center">
              <h3 className="text-2xl font-semibold dark:text-zinc-50 mb-2">
                Create Your Account
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Set up your account to get started with your {plan} plan
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
              <p className="text-sm text-blue-800 text-center">
                🚀 <strong>Quick Setup</strong> - Create your account now, then
                complete payment
              </p>
            </div>
          </div>

          {/* Form section */}
          <form action={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="first_name"
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  First Name
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  className="bg-muted text-md md:text-sm"
                  type="text"
                  placeholder="John"
                  autoComplete="given-name"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="last_name"
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  className="bg-muted text-md md:text-sm"
                  type="text"
                  placeholder="Doe"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                className="bg-muted text-md md:text-sm"
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                defaultValue={session?.user?.email || ''}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="company_name"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Company Name (Optional)
              </Label>
              <Input
                id="company_name"
                name="company_name"
                className="bg-muted text-md md:text-sm"
                type="text"
                placeholder="ABC Real Estate"
                autoComplete="organization"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="phone"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                name="phone"
                className="bg-muted text-md md:text-sm"
                type="tel"
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                className="bg-muted text-md md:text-sm"
                type="password"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <input type="hidden" name="plan" value={plan ?? ''} />
            <SubmitButton isSuccessful={isSuccessful}>
              {isSuccessful
                ? 'Creating Account...'
                : `Continue to ${plan?.charAt(0).toUpperCase() + plan?.slice(1)} Plan`}
            </SubmitButton>
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              {'Already have an account? '}
              <Link
                href="/login"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign in
              </Link>
              {' instead.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PreCheckoutPage() {
  return (
    <Suspense>
      <PreCheckoutPageInner />
    </Suspense>
  );
}
