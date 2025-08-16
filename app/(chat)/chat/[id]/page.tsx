import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { ErrorBoundary } from '@/components/error-boundary';
import { fetchDocumentMetadata } from '@/lib/db/queries';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await auth();

  // Server-side authentication check
  if (!session || session.user.type !== 'broker') {
    redirect('/login');
  }

  try {
    // Get document details - await params for Next.js 15 compatibility
    const document = await fetchDocumentMetadata(await params.id);

    if (!document) {
      redirect('/dashboard');
    }

    // Check if user owns this document
    if (document.broker_id !== session.user.id) {
      redirect('/dashboard');
    }

    // Create serializable session data
    const sessionData = {
      user: {
        id: session.user.id,
        email: session.user.email,
        type: session.user.type,
        first_name: session.user.first_name,
        last_name: session.user.last_name,
        company_name: session.user.company_name,
        subscription_tier: session.user.subscription_tier,
        logo_url: session.user.logo_url,
      },
      expires: session.expires,
    };

    return (
      <ErrorBoundary>
        <Chat
          id={await params.id}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          session={sessionData as any}
          autoResume={true}
          documentMetadata={{
            id: document.id,
            title: document.title,
            url: document.url || '',
            created_at: document.created_at,
          }}
        />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error loading chat:', error);
    redirect('/dashboard');
  }
}
