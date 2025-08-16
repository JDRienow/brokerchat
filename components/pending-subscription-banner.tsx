'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from '@/components/toast';

interface PendingSubscriptionBannerProps {
  plan: string;
  onCompletePayment: () => void;
}

export function PendingSubscriptionBanner({
  plan,
  onCompletePayment,
}: PendingSubscriptionBannerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCompletePayment = async () => {
    setIsLoading(true);
    try {
      onCompletePayment();
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to redirect to payment. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
          <Clock className="h-5 w-5 mr-2" />
          Complete Your Subscription
        </CardTitle>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          Your account is ready! Just complete your payment to start using all
          features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {plan === 'individual' ? '$25/month' : '$99/month'}
              </p>
            </div>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>

          <Button
            onClick={handleCompletePayment}
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isLoading ? 'Redirecting...' : 'Complete Payment'}
          </Button>

          <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
            You'll be redirected to Stripe to complete your payment securely
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
