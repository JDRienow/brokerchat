'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, Rocket, Zap, Users, FileText } from 'lucide-react';
import { toast } from '@/components/toast';
import { Suspense } from 'react';

function WelcomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      verifyPaymentAndGetUser(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPaymentAndGetUser = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        toast({
          type: 'error',
          description: 'Unable to verify payment. Please contact support.',
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        type: 'error',
        description: 'Something went wrong. Please contact support.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38b6ff] mx-auto mb-4" />
          <p>Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Image
              src="/images/om2chat-logo.svg"
              alt="OM2Chat"
              width={200}
              height={50}
              className="h-16 w-auto mx-auto mb-6"
            />
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome to OM2Chat!
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Your {plan} plan is now active. Let's get you started.
            </p>
          </div>

          {/* Success Message */}
          <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Payment Successful!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    Your {plan} subscription is now active. You can start using
                    all features immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Document Upload
                </CardTitle>
                <CardDescription>
                  Upload your real estate documents and get instant AI-powered
                  insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  AI Chat
                </CardTitle>
                <CardDescription>
                  Ask questions about your documents and get intelligent
                  responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Client Sharing
                </CardTitle>
                <CardDescription>
                  Share insights with clients through secure public links
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Rocket className="h-5 w-5 mr-2" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  Track usage and engagement with detailed analytics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Get Started
            </Button>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              You'll be redirected to your dashboard where you can start
              uploading documents
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomePageInner />
    </Suspense>
  );
}
