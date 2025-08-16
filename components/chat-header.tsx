'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { useEffect, useState } from 'react';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, VercelIcon, ArrowLeftIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import type { Session } from 'next-auth';
import { ProfilePopover } from './profile-popover';

interface DocumentMetadata {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  session,
  isPublic = false,
  documentMetadata: externalDocumentMetadata,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  isPublic?: boolean;
  documentMetadata?: {
    id: string;
    title: string;
    url: string;
    created_at: string;
  };
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  const [documentMetadata, setDocumentMetadata] =
    useState<DocumentMetadata | null>(null);

  // Check if this is a document chat (UUID format)
  const isDocumentChat =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      chatId,
    );

  useEffect(() => {
    // If external document metadata is provided (e.g., from public links), use it
    if (externalDocumentMetadata) {
      setDocumentMetadata(externalDocumentMetadata);
      return;
    }

    // Otherwise, fetch from API if this is a document chat
    if (isDocumentChat) {
      fetch(`/api/document?id=${chatId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setDocumentMetadata(data);
          }
        })
        .catch(console.error);
    }
  }, [chatId, isDocumentChat, externalDocumentMetadata]);

  return (
    <header className="flex sticky top-0 bg-background py-3 items-center px-2 md:px-2 gap-2 h-16">
      {/* Back to Dashboard Arrow for Document Chats */}
      {!isPublic && isDocumentChat && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 mr-2 z-10"
        >
          <ArrowLeftIcon size={16} />
          Back to Dashboard
        </Button>
      )}

      {/* Sidebar toggle for non-document chats */}
      {!isPublic && !isDocumentChat && <SidebarToggle />}

      {!isPublic && (!open || windowWidth < 768) && !isDocumentChat && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {/* Document Title - Absolutely Centered */}
      {isDocumentChat && documentMetadata && (
        <div className="absolute left-1/2 -translate-x-1/2 z-0">
          <h1 className="text-lg font-semibold text-foreground truncate max-w-[300px] md:max-w-[500px] text-center">
            {documentMetadata.title}
          </h1>
        </div>
      )}

      {!isReadonly && !isPublic && !isDocumentChat && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}

      {/* Profile Popover - Top Right */}
      {!isPublic && (
        <div className="ml-auto z-10">
          <ProfilePopover user={session?.user} />
        </div>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.isPublic === nextProps.isPublic &&
    prevProps.documentMetadata === nextProps.documentMetadata
  );
});
