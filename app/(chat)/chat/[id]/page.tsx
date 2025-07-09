import { notFound } from 'next/navigation';
import { fetchDocumentMetadata, fetchChatHistory } from '@/lib/db/queries';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '@/app/(auth)/auth';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
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

  return (
    <>
      <Chat
        key={documentId}
        id={documentId}
        initialMessages={initialMessages}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
