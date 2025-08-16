'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock, CreditCard, Zap, CheckCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { PlanUpgradeModal } from '@/components/plan-upgrade-modal';
import { toast } from '@/components/toast';

export default function PricingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [freshUserData, setFreshUserData] = useState<any>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    currentPlan: string;
    newPlan: string;
  }>({
    isOpen: false,
    currentPlan: '',
    newPlan: '',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch fresh user data from database
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const userData = await response.json();
            setFreshUserData(userData.user);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      };

      fetchUserData();
    }
  }, [status]);

  const handleUpgrade = (plan: string) => {
    // Use fresh data from database if available, otherwise fall back to session
    const currentPlan =
      freshUserData?.subscription_tier ||
      session?.user?.subscription_tier ||
      'individual';

    if (currentPlan === plan) {
      toast({
        type: 'error',
        description: 'You are already on this plan.',
      });
      return;
    }

    setModalState({
      isOpen: true,
      currentPlan,
      newPlan: plan,
    });
  };

  const handlePlanUpdate = async () => {
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: modalState.newPlan,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          type: 'success',
          description: result.message || 'Plan updated successfully!',
        });

        // Close modal and navigate to dashboard
        setModalState({ isOpen: false, currentPlan: '', newPlan: '' });

        // Navigate to dashboard with success message
        // The dashboard will fetch fresh data automatically
        toast({
          type: 'success',
          description: 'Plan updated successfully!',
        });

        setTimeout(() => {
          window.location.href = '/dashboard?plan_updated=true';
        }, 1000);
      } else {
        toast({
          type: 'error',
          description:
            result.error || 'Failed to update plan. Please try again.',
        });
      }
    } catch (error) {
      console.error('Plan update error:', error);
      toast({
        type: 'error',
        description: 'Network error. Please try again.',
      });
    }
  };

  const getSubscriptionStatus = () => {
    // Use fresh data from database if available, otherwise fall back to session
    const subscriptionTier =
      freshUserData?.subscription_tier || session?.user?.subscription_tier;

    // Debug: Log session data vs fresh data
    console.log('Pricing page data comparison:', {
      session: {
        subscription_tier: session?.user?.subscription_tier,
        subscription_status: session?.user?.subscription_status,
      },
      fresh: {
        subscription_tier: freshUserData?.subscription_tier,
        subscription_status: freshUserData?.subscription_status,
      },
      using: subscriptionTier,
    });

    if (!subscriptionTier) return 'expired';

    // Now subscription_tier directly indicates the plan type
    return subscriptionTier;
  };

  const subscriptionStatus = getSubscriptionStatus();

  const getPageContent = () => {
    switch (subscriptionStatus) {
      case 'free_trial':
        return {
          title: 'Free Trial',
          subtitle:
            'You are currently on a 14-day free trial. Upgrade to continue using OM2Chat after your trial ends.',
          icon: Clock,
          iconColor: 'text-blue-500',
          showCurrentPlan: false,
        };
      case 'expired':
      case 'trial':
      case 'free':
        return {
          title: 'Trial Expired',
          subtitle:
            'Your 14-day free trial has ended. Upgrade to continue using OM2Chat.',
          icon: Clock,
          iconColor: 'text-orange-500',
          showCurrentPlan: false,
        };
      case 'individual':
        return {
          title: 'Current Plan: Individual',
          subtitle:
            'You are currently on the Individual plan. Upgrade to Team for more features or manage your subscription.',
          icon: CheckCircle,
          iconColor: 'text-green-500',
          showCurrentPlan: true,
        };
      case 'team':
        return {
          title: 'Current Plan: Team',
          subtitle:
            'You are currently on the Team plan. Manage your subscription or explore other options.',
          icon: CheckCircle,
          iconColor: 'text-green-500',
          showCurrentPlan: true,
        };
      default:
        return {
          title: 'Choose Your Plan',
          subtitle: 'Select the plan that best fits your needs.',
          icon: Zap,
          iconColor: 'text-blue-500',
          showCurrentPlan: false,
        };
    }
  };

  const pageContent = getPageContent();
  const IconComponent = pageContent.icon;

  if (status === 'loading') {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background p-4 py-8">
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
            <IconComponent
              className={`w-12 h-12 ${pageContent.iconColor} mr-3`}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {pageContent.title}
            </h1>
          </div>
          <p className="text-gray-600">{pageContent.subtitle}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Zap className="w-5 h-5 mr-2" />
              Choose Your Plan
            </CardTitle>
            <CardDescription className="text-center">
              {subscriptionStatus === 'free_trial' ||
              subscriptionStatus === 'expired' ||
              subscriptionStatus === 'trial' ||
              subscriptionStatus === 'free'
                ? 'Continue with full access to all features'
                : 'Upgrade or manage your subscription'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Individual Plan */}
            <div
              className={`border rounded-lg p-4 ${subscriptionStatus === 'individual' ? 'bg-green-50 border-green-200' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Individual Plan</h3>
                <span className="text-2xl font-bold">$25</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">/month</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Up to 25 documents</li>
                <li>• Basic AI chat</li>
                <li>• Client sharing links</li>
                <li>• Email support</li>
              </ul>
              {subscriptionStatus === 'individual' ? (
                <div className="text-center">
                  <div className="text-green-600 text-sm font-medium mb-2">
                    ✓ Current Plan
                  </div>
                  <div className="text-sm text-gray-500">
                    You're currently on the Individual plan
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleUpgrade('individual')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading
                    ? 'Processing...'
                    : subscriptionStatus === 'expired' ||
                        subscriptionStatus === 'trial' ||
                        subscriptionStatus === 'free'
                      ? 'Upgrade to Individual'
                      : subscriptionStatus === 'team'
                        ? 'Switch to Individual'
                        : 'Switch to Individual'}
                </Button>
              )}
            </div>

            {/* Team Plan */}
            <div
              className={`border rounded-lg p-4 ${subscriptionStatus === 'team' ? 'bg-green-50 border-green-200' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Team Plan</h3>
                <span className="text-2xl font-bold">$75</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">/month</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Up to 200 documents</li>
                <li>• Advanced AI chat</li>
                <li>• Team collaboration</li>
                <li>• Priority support</li>
                <li>• Analytics dashboard</li>
              </ul>
              {subscriptionStatus === 'team' ? (
                <div className="text-center">
                  <div className="text-green-600 text-sm font-medium mb-2">
                    ✓ Current Plan
                  </div>
                  <div className="text-sm text-gray-500">
                    You're currently on the Team plan
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleUpgrade('team')}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading
                    ? 'Processing...'
                    : subscriptionStatus === 'expired' ||
                        subscriptionStatus === 'trial' ||
                        subscriptionStatus === 'free'
                      ? 'Upgrade to Team'
                      : subscriptionStatus === 'individual'
                        ? 'Upgrade to Team'
                        : 'Switch to Team'}
                </Button>
              )}
            </div>

            {/* Enterprise Plan */}
            <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Enterprise</h3>
                <span className="text-2xl font-bold">Custom</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                For large firms with custom needs
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Custom solutions</li>
                <li>• Dedicated support</li>
                <li>• Flexible pricing</li>
                <li>• Tailored features</li>
              </ul>
              <Button
                onClick={() => router.push('/contact-sales')}
                className="w-full"
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Profile Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/profile')}
            className="w-full"
          >
            Back to Profile
          </Button>
        </div>
      </div>

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({ isOpen: false, currentPlan: '', newPlan: '' })
        }
        currentPlan={modalState.currentPlan}
        newPlan={modalState.newPlan}
        onConfirm={handlePlanUpdate}
      />
    </div>
  );
}
