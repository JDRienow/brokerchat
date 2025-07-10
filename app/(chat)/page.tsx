import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { guestRegex } from '@/lib/constants';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Check if user is a guest - if so, redirect to login
  const isGuest = guestRegex.test(session?.user?.email ?? '');
  if (isGuest) {
    redirect('/login');
  }

  // For authenticated broker users, redirect to dashboard
  redirect('/dashboard');
}
