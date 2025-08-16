'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function PaymentRequiredPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Check if user has a pending subscription
    const checkSubscriptionStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const userData = await response.json();
            if (userData.user?.subscription_status === 'pending') {
              setIsLoading(false);
            } else {
              // Redirect to dashboard if subscription is active
              window.location.href = '/dashboard';
            }
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
          setIsLoading(false);
        }
      }
    };

    checkSubscriptionStatus();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-8 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center sm:px-16">
          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat"
            width={160}
            height={40}
            className="h-12 w-auto"
          />
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Payment Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Your account was created successfully, but payment is required to
            access the app.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800 text-center">
              ⚠️ <strong>Action Required</strong> - Complete your payment to
              unlock full access
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Complete your payment securely through Stripe</li>
              <li>• Get instant access to all features</li>
              <li>• Start using AI chat and document processing</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={async () => {
                setIsProcessingPayment(true);
                try {
                  const response = await fetch('/api/stripe/complete-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  });

                  if (response.ok) {
                    const { sessionId } = await response.json();
                    // Redirect to Stripe Checkout
                    window.location.href = `/api/stripe/redirect-to-checkout?session_id=${sessionId}`;
                  } else {
                    console.error('Failed to create checkout session');
                    alert(
                      'Failed to create checkout session. Please try again.',
                    );
                    setIsProcessingPayment(false);
                  }
                } catch (error) {
                  console.error('Error creating checkout session:', error);
                  alert('Error creating checkout session. Please try again.');
                  setIsProcessingPayment(false);
                }
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
            </button>

            <button
              type="button"
              disabled={isSigningOut}
              onClick={async () => {
                setIsSigningOut(true);
                try {
                  // Sign out without redirect first
                  await signOut({ redirect: false });
                  // Then manually redirect to landing page
                  window.location.href = '/';
                } catch (error) {
                  console.error('Error signing out:', error);
                  // Fallback: redirect to home page
                  window.location.href = '/';
                }
              }}
              className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            Need help? Contact{' '}
            <a
              href="mailto:support@om2chat.com"
              className="font-semibold text-blue-600 hover:underline"
            >
              support@om2chat.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
