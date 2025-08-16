'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/toast';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

function TeamAcceptPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid invitation link. Please check your email.');
      return;
    }

    // Validate the invitation token
    const validateInvitation = async () => {
      try {
        const response = await fetch(`/api/team/validate?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          setInvitation(data.invitation);
        } else {
          const error = await response.json();
          setErrorMessage(
            error.error ||
              'Invalid or expired invitation. Please contact your team admin for a new invite.',
          );
        }
      } catch (error) {
        console.error('Error validating invitation:', error);
        setErrorMessage(
          'Failed to validate invitation. Please try again later or contact support.',
        );
      }
    };

    validateInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        type: 'error',
        description: 'Passwords do not match',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        type: 'error',
        description: 'Password must be at least 8 characters long',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/team/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (response.ok) {
        // Automatically sign in the user after accepting the invitation
        const email = invitation.invited_email;
        const password = formData.password;
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        if (signInResult?.ok) {
          toast({
            type: 'success',
            description: 'Team invitation accepted! Welcome to your team.',
          });
          router.push('/dashboard');
        } else {
          toast({
            type: 'error',
            description:
              'Account created, but failed to sign in. Please log in manually.',
          });
          router.push('/login');
        }
      } else {
        const error = await response.json();
        toast({
          type: 'error',
          description: error.error || 'Failed to accept invitation',
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        type: 'error',
        description: 'Failed to accept invitation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat Logo"
            width={180}
            height={40}
            className="mx-auto mb-4"
            priority
          />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-700 mb-2">
              Invitation Error
            </h2>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            <Button onClick={() => (window.location.href = '/login')}>
              Go to Login
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            If you believe this is a mistake, please contact your team admin or{' '}
            <a href="mailto:support@om2chat.com" className="underline">
              support@om2chat.com
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6">
          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat Logo"
            width={180}
            height={40}
            className="mx-auto mb-4"
            priority
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat Logo"
            width={180}
            height={40}
            className="mx-auto mb-2"
            priority
          />
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            Join Your Team
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join{' '}
            {invitation.teams?.brokers?.first_name || 'a team'} on OM2Chat
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set Up Your Account</CardTitle>
            <CardDescription>
              Create your password and complete your profile to join the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation.invited_email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Enter your first name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Enter your last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Create a password (min 8 characters)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting up account...' : 'Join Team'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By accepting this invitation, you'll have access to shared documents
            and analytics with your team.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <TeamAcceptPageInner />
    </Suspense>
  );
}
