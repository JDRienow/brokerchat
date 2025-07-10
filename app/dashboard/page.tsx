import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { BrokerDashboardClient } from '@/components/broker-dashboard-client';
import { ErrorBoundary } from '@/components/error-boundary';

export default async function BrokerDashboard() {
  const session = await auth();

  // Server-side authentication check
  if (!session || session.user.type !== 'broker') {
    redirect('/login');
  }

  return (
    <ErrorBoundary>
      <BrokerDashboardClient session={session} />
    </ErrorBoundary>
  );
}
