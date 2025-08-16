import { auth } from '@/app/(auth)/auth';
import {
  fetchDocumentMetadata,
  vectorSimilaritySearch,
  insertChatMessage,
  insertChatMessageWithSession,
  getClientSessionByToken,
  updateClientSessionActivity,
  trackAnalyticsEvent,
} from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import {
  chatRateLimiter,
  checkDailyMessageLimit,
} from '@/lib/rate-limit-redis';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await chatRateLimiter(request);
  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: rateLimitResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
        },
      },
    );
  }

  // Check for broker authentication
  const session = await auth();

  // Check for public client session in request body
  const requestBody = await request.json();
  const { id: chatId, message, selectedChatModel, sessionToken } = requestBody;

  let isPublicUser = false;
  let publicSession = null;

  // If no broker session, check for public client session
  if (!session?.user && sessionToken) {
    console.log(
      'Checking public session with token:',
      sessionToken ? 'present' : 'missing',
    );
    try {
      publicSession = await getClientSessionByToken(sessionToken);
      console.log('Public session found:', publicSession ? 'yes' : 'no');
      if (publicSession?.public_link?.is_active) {
        console.log('Public link is active');
        isPublicUser = true;
      } else {
        console.log('Public link inactive or not found');
      }
    } catch (error) {
      console.error('Error verifying client session:', error);
    }
  }

  // Require either broker session or valid public session
  if (!session?.user && !isPublicUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check daily message limits for authenticated users
  if (session?.user?.id && session.user.type === 'broker') {
    const entitlements = entitlementsByUserType[session.user.type];
    const dailyLimitResult = await checkDailyMessageLimit(
      session.user.id,
      entitlements.maxMessagesPerDay,
    );

    if (!dailyLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Daily message limit exceeded',
          remaining: dailyLimitResult.remaining,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': entitlements.maxMessagesPerDay.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
      );
    }
  }

  try {
    if (!message?.parts?.length) {
      return new Response('Invalid message format', { status: 400 });
    }

    const userMessage = message.parts.find(
      (part: any) => part.type === 'text',
    )?.text;
    if (!userMessage) {
      return new Response('No text content found', { status: 400 });
    }

    // Check if this is a document-specific chat (UUID format)
    const isDocumentChat =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        chatId,
      );

    let systemMessage = 'You are a helpful AI assistant.';
    let context = '';

    if (isDocumentChat) {
      try {
        // Fetch document metadata
        const document = await fetchDocumentMetadata(chatId);
        if (!document) {
          return new Response('Document not found', { status: 404 });
        }

        // Get embedding for the user's message using OpenAI
        const embeddingRes = await fetch(
          'https://api.openai.com/v1/embeddings',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: OPENAI_EMBEDDING_MODEL,
              input: userMessage,
            }),
          },
        );

        if (embeddingRes.ok) {
          const embeddingJson = await embeddingRes.json();
          const embedding = embeddingJson.data[0].embedding;

          // Vector similarity search for relevant chunks
          const chunks = await vectorSimilaritySearch(chatId, embedding, 5);
          context = chunks.map((c: any) => c.content).join('\n---\n');

          console.log(
            `Found ${chunks.length} relevant chunks for query:`,
            userMessage,
          );

          // If no chunks found, provide basic document info as context
          if (chunks.length === 0) {
            context = `Document Information:
- Title: ${document.title}
- Document ID: ${document.id}
- Created: ${document.created_at}
- URL: ${document.url}

Note: The document content chunks are not yet processed in the database. I can only provide basic metadata about this document.`;
            console.log('No chunks found, using document metadata as context');
          }
        }

        systemMessage = `You are a helpful assistant for the document "${document.title}". Use the provided context to answer questions accurately. If the information isn't in the context, say so.\n\nContext:\n${context}`;
      } catch (error) {
        console.error('Document processing error:', error);
        // Continue with general chat if document processing fails
      }
    }

    // Use OpenAI API directly with streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response('OpenAI API error', { status: 500 });
    }

    // Create a readable stream to handle OpenAI's streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let fullResponse = '';
        const messageId = `msg_${Date.now()}`;

        if (!reader) {
          controller.close();
          return;
        }

        try {
          // Send start events
          controller.enqueue(encoder.encode('data: {"type":"start-step"}\n\n'));
          controller.enqueue(
            encoder.encode(
              `data: {"type":"text-start","id":"${messageId}"}\n\n`,
            ),
          );

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Send end events
                  controller.enqueue(
                    encoder.encode(
                      `data: {"type":"text-end","id":"${messageId}"}\n\n`,
                    ),
                  );
                  controller.enqueue(
                    encoder.encode('data: {"type":"finish-step"}\n\n'),
                  );
                  controller.enqueue(
                    encoder.encode('data: {"type":"finish"}\n\n'),
                  );
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));

                  // Save chat history when streaming is complete
                  if (isDocumentChat && fullResponse) {
                    try {
                      if (isPublicUser && publicSession) {
                        // Save with client session for public users
                        await insertChatMessageWithSession(
                          chatId,
                          'user',
                          userMessage,
                          publicSession.id,
                        );
                        await insertChatMessageWithSession(
                          chatId,
                          'assistant',
                          fullResponse,
                          publicSession.id,
                        );

                        // Update session activity and track analytics (non-blocking)
                        updateClientSessionActivity(
                          publicSession.id,
                          publicSession.total_messages + 2,
                        ).catch(console.error);

                        trackAnalyticsEvent({
                          broker_id: publicSession.public_link.broker_id,
                          public_link_id: publicSession.public_link.id,
                          client_session_id: publicSession.id,
                          event_type: 'chat_message',
                          event_data: {
                            message_count: 2,
                            user_message_length: userMessage.length,
                            assistant_message_length: fullResponse.length,
                          },
                        }).catch(console.error);
                      } else {
                        // Save normally for broker users (non-blocking)
                        insertChatMessage(chatId, 'user', userMessage).catch(
                          console.error,
                        );
                        insertChatMessage(
                          chatId,
                          'assistant',
                          fullResponse,
                        ).catch(console.error);
                      }
                    } catch (error) {
                      console.error('Failed to save chat history:', error);
                    }
                  }
                  controller.close();
                  return;
                }

                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    // Send text delta in AI SDK format
                    const deltaData = JSON.stringify({
                      type: 'text-delta',
                      id: messageId,
                      delta: content,
                    });
                    controller.enqueue(
                      encoder.encode(`data: ${deltaData}\n\n`),
                    );
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
