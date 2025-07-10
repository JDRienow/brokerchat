import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { ProfileClient } from '@/components/profile-client';

export default async function ProfilePage() {
  const session = await auth();

  // Server-side authentication check
  if (!session || session.user.type !== 'broker') {
    redirect('/login');
  }

  return <ProfileClient session={session} />;
}
