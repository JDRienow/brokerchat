'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import Image from 'next/image';
import { Suspense } from 'react';

import { BrokerRegistrationForm } from '@/components/broker-registration-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession } from 'next-auth/react';

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trialPlan = searchParams.get('trial_plan');
  const stripeSuccess = searchParams.get('stripe_success');
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan');

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists!' });
    } else if (state.status === 'trial_already_used') {
      toast({
        type: 'error',
        description:
          'This email has already been used for a free trial. Please use a different email or upgrade to a paid plan.',
      });
    } else if (state.status === 'email_banned') {
      toast({
        type: 'error',
        description:
          'This email address has been banned from free trials due to subscription cancellation. You can still sign up for a paid plan.',
      });
    } else if (state.status === 'stripe_error') {
      toast({
        type: 'error',
        description:
          'There was an issue with your payment. Please try again or contact support.',
      });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: 'Account created successfully!' });

      setIsSuccessful(true);
      updateSession();

      // Redirect to dashboard after successful registration
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000); // Small delay to show the success message
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat"
            width={160}
            height={40}
            className="h-12 w-auto"
          />
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            {stripeSuccess
              ? 'Complete Your Account Setup'
              : trialPlan
                ? 'Start Your Free Trial'
                : 'Create Broker Account'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {stripeSuccess
              ? `Complete your ${plan} plan setup by creating your account`
              : trialPlan
                ? `Get 14 days free access to our ${trialPlan} plan`
                : 'Join our platform to manage your real estate documents'}
          </p>
          {stripeSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-green-800 text-center">
                ✅ <strong>Payment successful!</strong> Your {plan} plan is
                ready. Just create your account to get started.
              </p>
            </div>
          )}
          {trialPlan && !stripeSuccess && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800 text-center">
                🎉 <strong>14-day free trial</strong> - No credit card required!
              </p>
            </div>
          )}
        </div>
        <BrokerRegistrationForm action={handleSubmit} defaultEmail={email}>
          {trialPlan && (
            <input type="hidden" name="trial_plan" value={trialPlan} />
          )}
          {stripeSuccess && sessionId && (
            <input type="hidden" name="stripe_session_id" value={sessionId} />
          )}
          {stripeSuccess && plan && (
            <input type="hidden" name="stripe_plan" value={plan} />
          )}
          <SubmitButton isSuccessful={isSuccessful}>
            {stripeSuccess
              ? 'Complete Setup'
              : trialPlan
                ? 'Start Free Trial'
                : 'Create Account'}
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
        </BrokerRegistrationForm>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
