'use client';

import React from 'react';

type FaqItemProps = {
  id: string;
  question: string;
  answer: React.ReactNode;
};

export function FaqItem({ id, question, answer }: FaqItemProps) {
  return (
    <details
      onToggle={(e) => {
        if (
          (e.target as HTMLDetailsElement).open &&
          typeof window !== 'undefined'
        ) {
          window.dispatchEvent(
            new CustomEvent('om2chat_analytics', {
              detail: { event: 'faq_expand', id },
            }),
          );
        }
      }}
      className="border rounded-md p-4"
    >
      <summary className="cursor-pointer font-medium">{question}</summary>
      <div className="mt-2 text-gray-600">{answer}</div>
    </details>
  );
}
