'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export function TrialCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Check trial status whenever we're authenticated and not on trial-expired page
    if (
      session?.user &&
      session.user.type === 'broker' &&
      pathname !== '/pricing'
    ) {
      // Add a small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        checkTrialStatus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [session, status, pathname]);

  const checkTrialStatus = async () => {
    if (isCheckingRef.current) return;

    isCheckingRef.current = true;
    console.log('Checking trial status...');

    try {
      const response = await fetch('/api/auth/check-trial');

      if (response.ok) {
        const data = await response.json();
        console.log('Trial check result:', data);

        if (!data.isValid && data.reason === 'Trial expired') {
          console.log('Trial expired, redirecting to pricing page');
          // Redirect to trial expired page
          router.push('/pricing');
        }
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // This component doesn't render anything
  return null;
}
