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

  // Only pass serializable session data
  const sessionData = {
    user: {
      id: session.user.id,
      email: session.user.email,
      type: session.user.type,
      first_name: session.user.first_name,
      last_name: session.user.last_name,
      company_name: session.user.company_name,
      subscription_tier: session.user.subscription_tier,
      subscription_status: session.user.subscription_status,
      logo_url: session.user.logo_url,
      team_id: session.user.team_id || undefined,
    },
    expires: session.expires,
  };

  return (
    <ErrorBoundary>
      <BrokerDashboardClient session={sessionData} />
    </ErrorBoundary>
  );
}
