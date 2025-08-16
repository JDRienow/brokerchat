'use client';

import { useState, useActionState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/toast';
import {
  UserIcon,
  LockIcon,
  CrossIcon,
  ArrowLeftIcon,
  PencilEditIcon,
  CheckCircleFillIcon,
} from '@/components/icons';
import { uploadFileToStorage } from '@/lib/supabase-storage';
import { getDaysRemainingInTrial, formatTrialDaysRemaining } from '@/lib/utils';
import { TrialCountdown } from '@/components/trial-countdown';

interface ProfileClientProps {
  session: Session;
}

interface PasswordChangeState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  message?: string;
}

interface ProfileUpdateState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  message?: string;
}

export function ProfileClient({ session }: ProfileClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);

  // Form state for profile editing
  const [profileData, setProfileData] = useState({
    first_name: session.user.first_name || '',
    last_name: session.user.last_name || '',
    company_name: session.user.company_name || '',
    logo_url: session.user.logo_url || '',
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  // Fetch fresh user data from database on component mount
  const [freshUserData, setFreshUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const userData = await response.json();
          setFreshUserData(userData.user);
          setProfileData({
            first_name: userData.user.first_name || '',
            last_name: userData.user.last_name || '',
            company_name: userData.user.company_name || '',
            logo_url: userData.user.logo_url || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const [passwordState, passwordAction] = useActionState<
    PasswordChangeState,
    FormData
  >(
    async (prevState: PasswordChangeState, formData: FormData) => {
      try {
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (!currentPassword || !newPassword || !confirmPassword) {
          return { status: 'invalid_data', message: 'All fields are required' };
        }

        if (newPassword !== confirmPassword) {
          return {
            status: 'invalid_data',
            message: 'New passwords do not match',
          };
        }

        if (newPassword.length < 6) {
          return {
            status: 'invalid_data',
            message: 'Password must be at least 6 characters',
          };
        }

        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });

        if (response.ok) {
          toast({
            type: 'success',
            description: 'Password changed successfully!',
          });
          return { status: 'success' };
        } else {
          const error = await response.json();
          return {
            status: 'failed',
            message: error.message || 'Failed to change password',
          };
        }
      } catch (error) {
        return {
          status: 'failed',
          message: 'Network error. Please try again.',
        };
      }
    },
    { status: 'idle' },
  );

  const [profileUpdateState, profileUpdateAction] = useActionState<
    ProfileUpdateState,
    FormData
  >(
    async (prevState: ProfileUpdateState, formData: FormData) => {
      try {
        const first_name = formData.get('first_name') as string;
        const last_name = formData.get('last_name') as string;
        const company_name = formData.get('company_name') as string;
        const logo_url = formData.get('logo_url') as string;

        if (!first_name || !last_name || !company_name) {
          return {
            status: 'invalid_data',
            message: 'First name, last name, and company name are required',
          };
        }

        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name,
            last_name,
            company_name,
            logo_url,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          toast({
            type: 'success',
            description: 'Profile updated successfully!',
          });
          setIsEditingProfile(false);

          // Update the local profile data with the server response
          const newProfileData = {
            first_name: result.user.first_name || '',
            last_name: result.user.last_name || '',
            company_name: result.user.company_name || '',
            logo_url: result.user.logo_url || '',
          };

          // Fetch fresh user data from the database
          const userResponse = await fetch('/api/profile');
          if (userResponse.ok) {
            const userData = await userResponse.json();

            setProfileData({
              first_name: userData.user.first_name || '',
              last_name: userData.user.last_name || '',
              company_name: userData.user.company_name || '',
              logo_url: userData.user.logo_url || '',
            });
          }

          return { status: 'success' };
        } else {
          const error = await response.json();
          return {
            status: 'failed',
            message: error.message || 'Failed to update profile',
          };
        }
      } catch (error) {
        return {
          status: 'failed',
          message: 'Network error. Please try again.',
        };
      }
    },
    { status: 'idle' },
  );

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: '/',
        redirect: false,
      });
      // Force redirect to landing page
      window.location.href = '/';
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to logout. Please try again.',
      });
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = async () => {
    setIsEditingProfile(false);
    // Reset form data by fetching fresh data from database
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const userData = await response.json();
        setProfileData({
          first_name: userData.user.first_name || '',
          last_name: userData.user.last_name || '',
          company_name: userData.user.company_name || '',
          logo_url: userData.user.logo_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data on cancel:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoUploadError(null);
    try {
      const uploadResult = await uploadFileToStorage(file, session.user.id);
      setProfileData((prev) => ({ ...prev, logo_url: uploadResult.url }));
      toast({ type: 'success', description: 'Logo uploaded successfully!' });
    } catch (err: any) {
      setLogoUploadError('Failed to upload logo. Please try again.');
      toast({ type: 'error', description: 'Failed to upload logo.' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          type: 'success',
          description:
            result.message ||
            'Subscription cancelled successfully. Your account has been deleted.',
        });
        setShowCancelConfirmation(false);

        // Sign out the user immediately since their account is deleted
        try {
          await signOut({
            callbackUrl: '/',
            redirect: false,
          });
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }

        // Redirect to landing page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        const error = await response.json();
        toast({
          type: 'error',
          description:
            error.message || 'Failed to cancel subscription. Please try again.',
        });
      }
    } catch (error) {
      toast({
        type: 'error',
        description: 'Network error. Please try again.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsManagingBilling(true);
      console.log('Opening billing portal...');

      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Billing portal response status:', response.status);

      if (response.ok) {
        const { url } = await response.json();
        console.log('Redirecting to billing portal:', url);
        window.location.href = url;
      } else {
        const error = await response.json();
        console.error('Billing portal error:', error);

        if (
          error.message?.includes('configuration') ||
          error.message?.includes('No confi')
        ) {
          toast({
            type: 'error',
            description:
              'Billing portal not configured. Please enable Customer Portal in your Stripe dashboard under Settings → Billing → Customer portal.',
          });
        } else {
          toast({
            type: 'error',
            description:
              error.message ||
              'Failed to open billing portal. Please try again.',
          });
        }
      }
    } catch (error) {
      console.error('Billing portal network error:', error);
      toast({
        type: 'error',
        description: 'Network error. Please try again.',
      });
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          type: 'success',
          description: 'Session refreshed! Please refresh the page.',
        });
        // Force page reload to get fresh session data
        window.location.reload();
      } else {
        toast({
          type: 'error',
          description: 'Failed to refresh session.',
        });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      toast({
        type: 'error',
        description: 'Failed to refresh session.',
      });
    }
  };

  // Use fresh data from database if available, otherwise fall back to session
  const subscriptionTier =
    freshUserData?.subscription_tier || session.user.subscription_tier;
  const subscriptionStatus =
    freshUserData?.subscription_status || session.user.subscription_status;
  const trialEndsAt =
    freshUserData?.trial_ends_at || session.user.trial_ends_at;

  // Debug: Log session data vs fresh data
  console.log('Profile page data comparison:', {
    session: {
      subscription_tier: session?.user?.subscription_tier,
      subscription_status: session?.user?.subscription_status,
      trial_ends_at: session?.user?.trial_ends_at,
    },
    fresh: {
      subscription_tier: freshUserData?.subscription_tier,
      subscription_status: freshUserData?.subscription_status,
      trial_ends_at: freshUserData?.trial_ends_at,
    },
    using: {
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
      trial_ends_at: trialEndsAt,
    },
  });

  const isPaidPlan =
    subscriptionTier === 'individual' || subscriptionTier === 'team';

  const isFreeTrial = subscriptionTier === 'free_trial';
  const isActiveSubscription = subscriptionStatus === 'active';

  // Calculate trial days remaining
  const trialDaysRemaining = isFreeTrial
    ? getDaysRemainingInTrial(trialEndsAt)
    : 0;
  const trialCountdownText = isFreeTrial
    ? formatTrialDaysRemaining(trialDaysRemaining)
    : '';

  // In ProfileClient, get isTeamAdmin from freshUserData or session
  const isTeamAdmin =
    freshUserData && (freshUserData as any).is_team_admin !== undefined
      ? !!(freshUserData as any).is_team_admin
      : !!(session.user as any)?.is_team_admin;

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      {/* Back to Dashboard Button - Top Left */}
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon size={16} />
          Back to Dashboard
        </Button>
      </div>

      {/* Profile Settings Header - Centered with Logo */}
      <div className="text-center mb-6">
        {profileData.logo_url ? (
          <Image
            src={profileData.logo_url}
            alt="Brokerage Logo"
            width={120}
            height={48}
            className="mx-auto mb-4 rounded"
            style={{ height: '48px', width: 'auto' }}
            priority
          />
        ) : (
          <Image
            src="/images/om2chat (400 x 100 px).svg"
            alt="OM2Chat"
            width={400}
            height={100}
            className="mx-auto mb-4"
            style={{ height: '40px', width: 'auto' }}
            priority
          />
        )}
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon />
              Account Information
            </div>
            {!isEditingProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                className="flex items-center gap-2"
              >
                <PencilEditIcon size={16} />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2"
                >
                  <CrossIcon size={16} />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  form="profile-form"
                  className="flex items-center gap-2"
                >
                  <CheckCircleFillIcon size={16} />
                  Save Changes
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <form id="profile-form" action={profileUpdateAction}>
              <div className="space-y-4">
                {/* Logo upload */}
                <div className="space-y-2">
                  <Label htmlFor="logo">Brokerage Logo</Label>
                  {profileData.logo_url && (
                    <div className="mb-2">
                      <Image
                        src={profileData.logo_url}
                        alt="Brokerage Logo Preview"
                        width={120}
                        height={48}
                        className="rounded"
                        style={{ height: '48px', width: 'auto' }}
                      />
                    </div>
                  )}
                  <Input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={logoUploading}
                  />
                  {logoUploading && <p className="text-sm">Uploading...</p>}
                  {logoUploadError && (
                    <p className="text-sm text-red-600">{logoUploadError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Recommended: Transparent PNG or SVG, 160x40px or 400x100px
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={(e) =>
                        handleInputChange('first_name', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={(e) =>
                        handleInputChange('last_name', e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={profileData.company_name}
                    onChange={(e) =>
                      handleInputChange('company_name', e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={session.user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                {/* Hidden input for logo_url to submit with form */}
                <input
                  type="hidden"
                  name="logo_url"
                  value={profileData.logo_url}
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </Label>
                  <p className="text-sm">
                    {profileData.first_name || 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </Label>
                  <p className="text-sm">
                    {profileData.last_name || 'Not set'}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Company Name
                </Label>
                <p className="text-sm">
                  {profileData.company_name || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                <p className="text-sm">{session.user.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription Status</span>
            <div className="flex gap-2">
              {isFreeTrial && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/pricing')}
                >
                  Upgrade Plan
                </Button>
              )}
              {isPaidPlan && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/pricing')}
                  >
                    Change Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={isManagingBilling}
                  >
                    {isManagingBilling ? 'Opening...' : 'Manage Billing'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => setShowCancelConfirmation(true)}
                  >
                    Cancel Plan
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
          <CardDescription>Your current subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {(subscriptionTier || 'free-trial')
                .replace('free_trial', 'Free Trial')
                .replace('individual', 'Individual')
                .replace('team', 'Team')
                .replace('enterprise', 'Enterprise')}
            </span>
            {isFreeTrial && (
              <span className="text-sm text-muted-foreground">
                (14-day trial)
              </span>
            )}
          </div>
          {isFreeTrial && trialCountdownText && (
            <div className="mt-2">
              <TrialCountdown trialEndsAt={trialEndsAt} variant="inline" />
            </div>
          )}
          {isFreeTrial && (
            <p className="text-sm text-muted-foreground mt-2">
              Upgrade to a paid plan to unlock unlimited documents and team
              features.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Popup */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">
                Cancel Subscription
              </CardTitle>
              <CardDescription>
                Are you sure you want to cancel your subscription?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  ⚠️ Important Notice
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Your subscription will be cancelled immediately</li>
                  <li>• You'll lose access to premium features</li>
                  <li>
                    • All your documents and data will be permanently deleted
                  </li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirmation(false)}
                  disabled={isCancelling}
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span>Team Management</span>
          </CardTitle>
          <CardDescription>
            {subscriptionTier === 'team'
              ? 'Invite team members and manage collaboration'
              : subscriptionTier === 'free_trial'
                ? 'Upgrade to Team plan to invite up to 4 team members'
                : 'Upgrade to Team plan to invite up to 4 team members'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionTier === 'team' ? (
            <TeamManagementEmbedded />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">
                  Team features not available
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {subscriptionTier === 'free_trial'
                  ? 'Upgrade to the Team plan to invite team members and enable collaboration features.'
                  : 'Upgrade to the Team plan to invite team members and enable collaboration features.'}
              </p>
              <Button onClick={() => router.push('/pricing')}>
                {subscriptionTier === 'free_trial'
                  ? 'Upgrade to Team Plan'
                  : 'View Team Plan'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockIcon />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button
              onClick={() => setIsChangingPassword(true)}
              variant="outline"
            >
              Change Password
            </Button>
          ) : (
            <form action={passwordAction} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1"
                />
              </div>

              {passwordState.status === 'invalid_data' && (
                <p className="text-sm text-red-600">{passwordState.message}</p>
              )}

              {passwordState.status === 'failed' && (
                <p className="text-sm text-red-600">{passwordState.message}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={passwordState.status === 'in_progress'}
                >
                  {passwordState.status === 'in_progress'
                    ? 'Updating...'
                    : 'Update Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Logout Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CrossIcon />
            Sign Out
          </CardTitle>
          <CardDescription>
            Sign out of your account on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-fit border-red-500 text-red-500 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Embedded Team Management Component

type TeamSlot =
  | { type: 'user'; value: string; name: string; isAdmin: boolean; id: string }
  | { type: 'invited'; value: string; id: string; createdAt: string }
  | { type: 'empty'; value: string };

function TeamManagementEmbedded() {
  'use client';
  const [slots, setSlots] = useState<TeamSlot[]>([
    { type: 'empty', value: '' },
    { type: 'empty', value: '' },
    { type: 'empty', value: '' },
    { type: 'empty', value: '' },
    { type: 'empty', value: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  // Fetch user info to determine if current user is admin
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        // Check if current user is the team admin by comparing IDs
        const adminMember = members.find((m: any) => m.is_team_admin);
        const isCurrentUserAdmin =
          adminMember && adminMember.id === data.user.id;
        setIsAdmin(isCurrentUserAdmin);
      }
    };
    fetchUser();
  }, [members]); // Add members as dependency so this runs when team data loads

  // Fetch team data and map to slots
  const fetchTeamData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const data = await response.json();
        console.log(
          'TeamManagementEmbedded: team members API response',
          data.members,
        );
        setMembers(data.members || []);
        setInvitations(data.invitations || []);
        const membersArr = data.members || [];
        const invitationsArr = data.invitations || [];
        const admin = membersArr.find((m: any) => m.is_team_admin);
        const nonAdminMembers = membersArr.filter((m: any) => !m.is_team_admin);
        const slotsArr = [];
        if (admin) {
          slotsArr.push({
            type: 'user' as const,
            value: admin.email,
            name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim(),
            isAdmin: true,
            id: admin.id,
          });
        }
        nonAdminMembers.forEach((member: any) => {
          slotsArr.push({
            type: 'user' as const,
            value: member.email,
            name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
            isAdmin: false,
            id: member.id,
          });
        });
        invitationsArr.forEach((invite: any) => {
          slotsArr.push({
            type: 'invited' as const,
            value: invite.invited_email,
            id: invite.id,
            createdAt: invite.created_at,
          });
        });
        while (slotsArr.length < 5) {
          slotsArr.push({ type: 'empty' as const, value: '' });
        }
        setSlots(slotsArr.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  // Invite
  const [inviteInputs, setInviteInputs] = useState(['', '', '', '', '']);
  const [inviting, setInviting] = useState([false, false, false, false, false]);

  const handleInvite = async (index: number) => {
    const email = inviteInputs[index].trim();
    if (!email) return;
    setInviting((prev) => {
      const arr = [...prev];
      arr[index] = true;
      return arr;
    });
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        toast({ type: 'success', description: 'Invitation sent!' });
        setInviteInputs((prev) => {
          const arr = [...prev];
          arr[index] = '';
          return arr;
        });
        fetchTeamData();
      } else {
        const error = await response.json();
        toast({
          type: 'error',
          description: error.error || 'Failed to invite',
        });
      }
    } finally {
      setInviting((prev) => {
        const arr = [...prev];
        arr[index] = false;
        return arr;
      });
    }
  };

  // Remove member or cancel invite
  const handleRemove = async (slot: TeamSlot) => {
    if (slot.type === 'user' && !slot.isAdmin) {
      // Remove member
      await fetch(`/api/team?memberId=${slot.id}`, { method: 'DELETE' });
      fetchTeamData();
    } else if (slot.type === 'invited') {
      // Cancel invite
      await fetch(`/api/team?invitationId=${slot.id}`, { method: 'DELETE' });
      fetchTeamData();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading team data...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading team data...
            </p>
          </div>
        </div>
      );
    }
    // Find the admin email from members
    const adminMember = members.find((m: any) => m.is_team_admin);
    const adminEmail = adminMember ? adminMember.email : null;
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-muted/50 text-center">
          {adminEmail ? (
            <>
              You are on <span className="font-semibold">{adminEmail}</span>'s
              team.
            </>
          ) : (
            <>You are on your admin's team.</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">
            Invite Team Members (
            {slots.filter((s) => s.type !== 'empty').length}/5)
          </h4>
        </div>
        <div className="space-y-3">
          {slots.map((slot, idx) => {
            if (slot.type === 'empty' && !isAdmin) return null;
            return (
              <div
                key={`slot-${idx}-${slot.value}`}
                className="flex gap-2 items-center"
              >
                {slot.type === 'user' ? (
                  <>
                    <Input
                      value={slot.value}
                      disabled
                      className="bg-gray-100"
                    />
                    <span
                      className={`text-xs px-2 py-1 rounded ${slot.isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {slot.isAdmin ? 'Admin' : 'User'}
                    </span>
                    {isAdmin && !slot.isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(slot)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <CrossIcon size={16} />
                      </Button>
                    )}
                  </>
                ) : slot.type === 'invited' ? (
                  <>
                    <Input
                      value={slot.value}
                      disabled
                      className="bg-gray-100"
                    />
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Invited
                    </span>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(slot)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <CrossIcon size={16} />
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {isAdmin ? (
                      <>
                        <Input
                          type="email"
                          value={inviteInputs[idx]}
                          onChange={(e) =>
                            setInviteInputs((prev) => {
                              const arr = [...prev];
                              arr[idx] = e.target.value;
                              return arr;
                            })
                          }
                          placeholder={`Enter email address for team member ${idx + 1}`}
                          disabled={inviting[idx]}
                        />
                        <Button
                          onClick={() => handleInvite(idx)}
                          disabled={
                            inviting[idx] ||
                            !inviteInputs[idx].trim() ||
                            slots.filter((s) => s.type !== 'empty').length >= 5
                          }
                          variant={
                            inviteInputs[idx].trim() ? 'default' : 'outline'
                          }
                          size="sm"
                        >
                          {inviting[idx] ? 'Sending...' : 'Invite'}
                        </Button>
                      </>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
