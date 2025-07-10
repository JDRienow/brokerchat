'use client';

import useSWR from 'swr';
import type { VisibilityType } from '@/components/visibility-selector';

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    },
  );

  // For broker app, just use local visibility since we don't have chat history
  const visibilityType = localVisibility;

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
    // No need to mutate history cache since we don't use it
  };

  return { visibilityType, setVisibilityType };
}
