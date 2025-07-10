'use client';

import { useState, useActionState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Form state for profile editing
  const [profileData, setProfileData] = useState({
    first_name: session.user.first_name || '',
    last_name: session.user.last_name || '',
    company_name: session.user.company_name || '',
  });

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
          }),
        });

        if (response.ok) {
          toast({
            type: 'success',
            description: 'Profile updated successfully!',
          });
          setIsEditingProfile(false);
          // Update session data would require a page refresh or session refresh
          // For now, we'll just exit edit mode
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
        redirectTo: '/login',
      });
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

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form data to original values
    setProfileData({
      first_name: session.user.first_name || '',
      last_name: session.user.last_name || '',
      company_name: session.user.company_name || '',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

      {/* Profile Settings Header - Centered with Profile Box */}
      <div className="text-center mb-6">
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditingProfile ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email Address</Label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {session.user.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md capitalize">
                    {session.user.type}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">First Name</Label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {session.user.first_name || 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Name</Label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {session.user.last_name || 'Not set'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Company</Label>
                <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                  {session.user.company_name || 'Not set'}
                </p>
              </div>
            </>
          ) : (
            <form action={profileUpdateAction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email Address</Label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {session.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md capitalize">
                    {session.user.type}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={profileData.first_name}
                    onChange={(e) =>
                      handleInputChange('first_name', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={profileData.last_name}
                    onChange={(e) =>
                      handleInputChange('last_name', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company_name" className="text-sm font-medium">
                  Company Name *
                </Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  required
                  value={profileData.company_name}
                  onChange={(e) =>
                    handleInputChange('company_name', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              {profileUpdateState.status === 'invalid_data' && (
                <p className="text-sm text-red-600">
                  {profileUpdateState.message}
                </p>
              )}

              {profileUpdateState.status === 'failed' && (
                <p className="text-sm text-red-600">
                  {profileUpdateState.message}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={profileUpdateState.status === 'in_progress'}
                  className="flex items-center gap-2"
                >
                  {profileUpdateState.status === 'in_progress' ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircleFillIcon size={16} />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
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
            variant="destructive"
            className="w-fit"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
