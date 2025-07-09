'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisibilityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  if (!OPENAI_API_KEY) {
    return 'New Chat'; // Fallback title if no API key
  }

  try {
    const completionRes = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You will generate a short title based on the first message a user begins a conversation with.
- Ensure it is not more than 80 characters long
- The title should be a summary of the user's message  
- Do not use quotes or colons`,
            },
            {
              role: 'user',
              content: JSON.stringify(message),
            },
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      },
    );

    if (completionRes.ok) {
      const completionJson = await completionRes.json();
      return completionJson.choices[0].message.content;
    } else {
      console.error('Failed to generate title:', await completionRes.text());
      return 'New Chat';
    }
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Chat'; // Fallback title
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
