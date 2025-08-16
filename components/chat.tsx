'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { motion } from 'framer-motion';

export function Chat({
  id,
  initialMessages,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
  isPublic = false,
  documentMetadata,
  hideGreetingTitle = false,
  hideHeader = false,
  headerOffsetPx = 0,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
  isPublic?: boolean;
  documentMetadata?: {
    id: string;
    title: string;
    url: string;
    created_at: string;
  };
  hideGreetingTitle?: boolean;
  hideHeader?: boolean;
  headerOffsetPx?: number; // extra top offset when parent renders its own fixed header
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>('');

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 50, // Reduced from 100ms to 50ms for faster response
    generateId: generateUUID,

    transport: new DefaultChatTransport({
      api: isPublic ? '/api/public-chat' : '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        const sessionToken =
          isPublic && session ? (session as any).session_token : undefined;
        if (isPublic) {
          console.log(
            'Public chat - session token:',
            sessionToken ? 'present' : 'missing',
          );
        }

        // For public chat, send a simplified format
        if (isPublic) {
          const lastMessage = messages.at(-1);
          let messageText = '';

          // Extract text from message parts
          if (lastMessage?.parts && lastMessage.parts.length > 0) {
            const firstPart = lastMessage.parts[0];
            if (firstPart.type === 'text') {
              messageText = firstPart.text || '';
            }
          }

          return {
            body: {
              session_token: sessionToken,
              message: messageText,
              chat_id: id,
            },
          };
        }

        // For regular chat, use the original format
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: 'gpt-4o',
            selectedVisibilityType: visibilityType,
            ...(sessionToken && { sessionToken }),
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      // No need to mutate chat history cache for broker app
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      if (!isPublic) {
        window.history.replaceState({}, '', `/chat/${id}`);
      }
    }
  }, [query, sendMessage, hasAppendedQuery, id, isPublic]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 && !isPublic ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Get scroll functions for the outer container
  const {
    containerRef: scrollContainerRef,
    scrollToBottomManual,
    isAtBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-screen bg-background relative">
        {/* Fixed Chat Header */}
        {!hideHeader && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
            <ChatHeader
              chatId={id}
              selectedVisibilityType={initialVisibilityType}
              isReadonly={isReadonly}
              session={session}
              isPublic={isPublic}
              documentMetadata={documentMetadata}
            />
          </div>
        )}

        {/* Scrollable Messages Area - positioned between fixed header and input */}
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto px-2 md:px-0"
          style={{
            position: 'absolute',
            top: !hideHeader ? '64px' : `${headerOffsetPx}px`,
            bottom: '120px',
            left: '0',
            right: '0',
            zIndex: 10,
            height: !hideHeader
              ? 'calc(100vh - 184px)'
              : `calc(100vh - ${120 + headerOffsetPx}px)`,
            paddingTop: !hideHeader || headerOffsetPx > 0 ? '16px' : '0px',
          }}
        >
          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
            hideGreetingTitle={hideGreetingTitle}
          />

          {/* Viewport detection element for the outer container */}
          <motion.div
            className="shrink-0 min-w-[24px] min-h-[60px]"
            onViewportLeave={onViewportLeave}
            onViewportEnter={onViewportEnter}
          />
        </div>

        {/* Fixed Input at Bottom */}
        <form className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-sm px-4 py-4">
          <div className="flex mx-auto gap-2 w-full md:max-w-3xl">
            {!isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                sendMessage={sendMessage}
                selectedVisibilityType={visibilityType}
                scrollToBottomManual={scrollToBottomManual}
                isAtBottom={isAtBottom}
                isPublic={isPublic}
              />
            )}
          </div>
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
