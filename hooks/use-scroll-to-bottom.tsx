import useSWR from 'swr';
import { useRef, useEffect, useCallback } from 'react';

type ScrollFlag = ScrollBehavior | false;

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: isAtBottom = false, mutate: setIsAtBottom } = useSWR(
    'messages:is-at-bottom',
    null,
    { fallbackData: false },
  );

  const { data: scrollBehavior = false, mutate: setScrollBehavior } =
    useSWR<ScrollFlag>('messages:should-scroll', null, { fallbackData: false });

  useEffect(() => {
    if (scrollBehavior && containerRef.current) {
      // Scroll to show the user's message with proper spacing
      const container = containerRef.current;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Calculate scroll position to show the last message with adequate spacing
      // Use 1/3 of the container height + 60px as spacing to ensure good positioning
      const spacing = Math.max(180, clientHeight / 3 + 60);
      const targetScrollTop = scrollHeight - clientHeight - spacing;

      if (scrollBehavior === 'smooth') {
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      } else {
        container.scrollTop = targetScrollTop;
      }

      setScrollBehavior(false);
    }
  }, [setScrollBehavior, scrollBehavior]);

  const scrollToBottom = useCallback(
    (scrollBehavior: ScrollBehavior = 'smooth') => {
      setScrollBehavior(scrollBehavior);
    },
    [setScrollBehavior],
  );

  const scrollToBottomManual = useCallback(
    (scrollBehavior: ScrollBehavior = 'smooth') => {
      if (containerRef.current) {
        const container = containerRef.current;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Scroll to the actual bottom for manual button clicks
        const targetScrollTop = scrollHeight - clientHeight;

        if (scrollBehavior === 'smooth') {
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
        } else {
          container.scrollTop = targetScrollTop;
        }
      }
    },
    [],
  );

  function onViewportEnter() {
    setIsAtBottom(true);
  }

  function onViewportLeave() {
    setIsAtBottom(false);
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    scrollToBottomManual,
    onViewportEnter,
    onViewportLeave,
  };
}
