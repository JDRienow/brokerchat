import { useState, useEffect } from 'react';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

export function useMessages({
  chatId,
  status,
}: {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    scrollToBottomManual,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<
    'none' | 'smooth' | 'instant'
  >('none');

  useEffect(() => {
    if (chatId) {
      scrollToBottom('instant');
      setHasSentMessage(false);
    }
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (status === 'submitted') {
      setHasSentMessage(true);
      setIsAIResponding(false);
      // Scroll when user sends message
      setShouldAutoScroll('smooth');
    } else if (status === 'streaming') {
      setIsAIResponding(true);
      // Suspend auto scroll during AI response
      setShouldAutoScroll('none');
    } else if (status === 'ready') {
      setIsAIResponding(false);
      // On finish, if user initiated and we were near bottom, scroll fully
      if (hasSentMessage) {
        setShouldAutoScroll('smooth');
      }
    }
  }, [status, hasSentMessage]);

  useEffect(() => {
    if (shouldAutoScroll === 'smooth') {
      scrollToBottom('smooth');
      setShouldAutoScroll('none');
    } else if (shouldAutoScroll === 'instant') {
      scrollToBottom('instant');
      setShouldAutoScroll('none');
    }
  }, [shouldAutoScroll, scrollToBottom]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    scrollToBottomManual,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
    isAIResponding,
  };
}
