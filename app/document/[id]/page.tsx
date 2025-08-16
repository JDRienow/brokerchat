import { notFound } from 'next/navigation';
import { fetchDocumentMetadata, fetchChatHistory } from '@/lib/db/queries';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '@/app/(auth)/auth';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';
import Script from 'next/script';

import type { ChatMessage } from '@/lib/types';

export default async function Page({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await params;

  const session = await auth();
  if (!session) {
    notFound();
  }

  // Fetch document metadata and chat history from Supabase
  let document = null;
  let chatHistory = [];
  try {
    document = await fetchDocumentMetadata(documentId);
    chatHistory = await fetchChatHistory(documentId);
  } catch {
    // If document not found, show error
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
        <p className="text-muted-foreground">
          The document you are looking for does not exist.
        </p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
        <p className="text-muted-foreground">
          The document you are looking for does not exist.
        </p>
      </div>
    );
  }

  // Transform chat history to UIMessage format
  const initialMessages: ChatMessage[] = chatHistory.map((msg: any) => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text', text: msg.content }],
    metadata: {
      createdAt: msg.created_at,
    },
  }));

  // Add initial system message about the document if no chat history exists
  if (initialMessages.length === 0) {
    initialMessages.push({
      id: 'system-welcome',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: `Hello! I'm here to help you with questions about "${document.title}". You can ask me anything about this document and I'll provide answers based on its content.`,
        },
      ],
      metadata: {
        createdAt: new Date().toISOString(),
      },
    });
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

  // Document chats get a completely standalone layout without any sidebar
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={false}>
          <main className="flex justify-center w-full h-dvh bg-background">
            <div className="flex flex-col h-dvh bg-background w-full max-w-4xl">
              <ErrorBoundary>
                <Chat
                  key={documentId}
                  id={documentId}
                  initialMessages={initialMessages}
                  initialVisibilityType="private"
                  isReadonly={false}
                  session={sessionData as any}
                  autoResume={false}
                  documentMetadata={{
                    id: document.id,
                    title: document.title,
                    url: document.url,
                    created_at: document.created_at,
                  }}
                />
                <DataStreamHandler />
              </ErrorBoundary>
            </div>
          </main>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
