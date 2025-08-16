'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/toast';

function SetupAccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    console.log('SetupAccountPage loaded');
  }, []);

  // Request setup link
  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Requesting setup link for:', email);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/send-setup-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
        toast({
          type: 'success',
          description: 'Setup link sent! Check your email.',
        });
      } else {
        const err = await res.json();
        toast({
          type: 'error',
          description: err.error || 'Failed to send setup link.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set password with token
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ type: 'error', description: 'Passwords do not match.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        toast({
          type: 'success',
          description: 'Password set! You can now log in.',
        });
        setTimeout(() => router.push('/login'), 1500);
      } else {
        const err = await res.json();
        toast({
          type: 'error',
          description: err.error || 'Failed to set password.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Set Up Your Account
        </h1>
        <p className="text-sm text-gray-600 mb-4 text-center">
          {token
            ? 'Set your password to complete account setup'
            : 'Enter your email to receive a setup link'}
        </p>
        {token ? (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestLink} className="space-y-4">
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Setup Link'}
            </button>
            {sent && (
              <p className="text-green-600 text-center">
                Setup link sent! Check your email.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SetupAccountPageInner />
    </Suspense>
  );
}
