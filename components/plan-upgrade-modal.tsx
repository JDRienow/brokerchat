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
import { toast } from '@/components/toast';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  newPlan: string;
  onConfirm: () => Promise<void>;
}

const PLAN_PRICES = {
  individual: 25,
  team: 75,
};

const PLAN_NAMES = {
  individual: 'Individual',
  team: 'Team',
};

export function PlanUpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  newPlan,
  onConfirm,
}: PlanUpgradeModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const isUpgrade =
    PLAN_PRICES[newPlan as keyof typeof PLAN_PRICES] >
    PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES];
  const priceDifference = Math.abs(
    PLAN_PRICES[newPlan as keyof typeof PLAN_PRICES] -
      PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES],
  );

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await onConfirm();
      // Don't close modal here - let the parent handle it after success
    } catch (error) {
      console.error('Plan update error:', error);
      // Keep modal open on error so user can try again
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isUpgrade ? 'Upgrade Plan' : 'Downgrade Plan'}
          </CardTitle>
          <CardDescription className="text-center">
            Confirm your plan change
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              ⚠️ Important Information
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Your current{' '}
                {PLAN_NAMES[currentPlan as keyof typeof PLAN_NAMES]} plan will
                be cancelled
              </li>
              <li>
                • You will be charged $
                {PLAN_PRICES[newPlan as keyof typeof PLAN_PRICES]}/month for the{' '}
                {PLAN_NAMES[newPlan as keyof typeof PLAN_NAMES]} plan
              </li>
              {isUpgrade && (
                <li>
                  • You will be charged ${priceDifference} for the prorated
                  upgrade
                </li>
              )}
              <li>• The change will take effect immediately</li>
            </ul>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Current Plan:</span>
            <span className="text-gray-600">
              {PLAN_NAMES[currentPlan as keyof typeof PLAN_NAMES]} ($
              {PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES]}/month)
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="font-medium">New Plan:</span>
            <span className="text-green-700 font-semibold">
              {PLAN_NAMES[newPlan as keyof typeof PLAN_NAMES]} ($
              {PLAN_PRICES[newPlan as keyof typeof PLAN_PRICES]}/month)
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating
                ? 'Updating...'
                : `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
