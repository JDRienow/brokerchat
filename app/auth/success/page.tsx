'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, CreditCard, UserPlus, LogIn } from 'lucide-react';

function AuthSuccessPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      // Verify the checkout session
      verifyCheckoutSession(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const verifyCheckoutSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      } else {
        console.error('Failed to verify session');
      }
    } catch (error) {
      console.error('Error verifying session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38b6ff] mx-auto mb-4" />
          <p>Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat"
            width={160}
            height={40}
            className="h-12 w-auto mx-auto mb-4"
          />
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Subscription Active!
            </h1>
          </div>
          <p className="text-gray-600">
            Your 14-day free trial has been activated. Create your account to
            get started.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Subscription Details
            </CardTitle>
            <CardDescription className="text-center">
              {subscriptionData?.plan === 'individual'
                ? 'Individual Plan'
                : 'Team Plan'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Plan:</span>
                <span className="font-medium">
                  {subscriptionData?.plan === 'individual'
                    ? 'Individual'
                    : 'Team'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trial Period:</span>
                <span className="font-medium">14 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/register')}
            className="w-full bg-[#38b6ff] hover:bg-[#1e40af] text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Account
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/login')}
            className="w-full"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#38b6ff] hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AuthSuccessPageInner />
    </Suspense>
  );
}
