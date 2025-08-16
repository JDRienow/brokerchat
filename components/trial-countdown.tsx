'use client';

import { getDaysRemainingInTrial, formatTrialDaysRemaining } from '@/lib/utils';

interface TrialCountdownProps {
  trialEndsAt: string | Date | null;
  variant?: 'banner' | 'inline' | 'compact';
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
}

export function TrialCountdown({
  trialEndsAt,
  variant = 'inline',
  showUpgradeButton = false,
  onUpgradeClick,
}: TrialCountdownProps) {
  const daysRemaining = getDaysRemainingInTrial(trialEndsAt);
  const countdownText = formatTrialDaysRemaining(daysRemaining);
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;

  console.log('TrialCountdown component:', {
    trialEndsAt,
    daysRemaining,
    countdownText,
    isExpiringSoon,
    variant,
    showUpgradeButton,
  });

  if (daysRemaining === 0) {
    console.log('TrialCountdown: Not rendering - days remaining is 0');
    return null;
  }

  if (variant === 'banner') {
    const bgColor = isExpiringSoon
      ? 'bg-orange-50 border-orange-200'
      : 'bg-blue-50 border-blue-200';
    const textColor = isExpiringSoon ? 'text-orange-800' : 'text-blue-800';
    const subTextColor = isExpiringSoon ? 'text-orange-600' : 'text-blue-600';
    const iconColor = isExpiringSoon ? 'text-orange-600' : 'text-blue-600';
    const buttonColor = isExpiringSoon
      ? 'bg-orange-600 hover:bg-orange-700'
      : 'bg-blue-600 hover:bg-blue-700';

    return (
      <div className={`${bgColor} border rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={iconColor}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${textColor}`}>
                {isExpiringSoon ? '⚠️ Trial Expiring Soon' : 'Free Trial'} -{' '}
                {countdownText}
              </p>
              <p className={`text-xs ${subTextColor}`}>
                {isExpiringSoon
                  ? 'Your trial ends soon! Upgrade now to keep your data and continue using all features.'
                  : 'Upgrade to continue using all features after your trial ends'}
              </p>
            </div>
          </div>
          {showUpgradeButton && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className={`${buttonColor} text-white px-3 py-1 rounded text-sm`}
            >
              {isExpiringSoon ? 'Upgrade Now' : 'Upgrade Now'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    const textColor = isExpiringSoon ? 'text-orange-600' : 'text-blue-600';
    return (
      <span className={`text-sm font-medium ${textColor}`}>
        {isExpiringSoon ? '⚠️' : '⏰'} {countdownText}
      </span>
    );
  }

  // Default inline variant
  const textColor = isExpiringSoon ? 'text-orange-600' : 'text-blue-600';
  return (
    <div className={`text-sm font-medium ${textColor}`}>
      {isExpiringSoon ? '⚠️' : '⏰'} {countdownText}
    </div>
  );
}
