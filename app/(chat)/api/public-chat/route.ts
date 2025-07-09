import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getClientSessionByToken,
  updateClientSessionActivity,
  insertChatMessageWithSession,
  vectorSimilaritySearch,
  trackAnalyticsEvent,
} from '@/lib/db/queries';

// POST: Handle client chat messages for public links
export async function POST(request: NextRequest) {
  try {
    const { session_token, message, chat_id } = await request.json();

    if (!session_token || !message) {
      return NextResponse.json(
        { error: 'Missing session_token or message' },
        { status: 400 },
      );
    }

    // Get the client session
    const clientSession = await getClientSessionByToken(session_token);

    if (!clientSession) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 },
      );
    }

    const { public_link } = clientSession;
    if (!public_link || !public_link.is_active) {
      return NextResponse.json(
        { error: 'Public link not active' },
        { status: 403 },
      );
    }

    const documentId = public_link.document_metadata.id;

    // Insert user message
    await insertChatMessageWithSession(
      documentId,
      'user',
      message,
      clientSession.id,
    );

    // Track analytics event
    await trackAnalyticsEvent({
      broker_id: public_link.broker_id,
      public_link_id: public_link.id,
      client_session_id: clientSession.id,
      event_type: 'chat_message',
      event_data: { message_type: 'user', message_length: message.length },
    });

    // Generate embedding for the user message
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_EMBEDDING_MODEL =
      process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Get embedding for the user message
    const embeddingResponse = await fetch(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: message,
          model: OPENAI_EMBEDDING_MODEL,
        }),
      },
    );

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Search for relevant document chunks
    const relevantChunks = await vectorSimilaritySearch(
      documentId,
      embedding,
      5,
    );

    console.log(
      `Found ${relevantChunks.length} relevant chunks for query: ${message}`,
    );

    // Create context from relevant chunks
    const context = relevantChunks
      .map((chunk: any) => chunk.content)
      .join('\n\n');

    // Generate AI response
    const completion = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that answers questions about a document. Use the following context to answer the user's question. If the context doesn't contain enough information, say so politely.

Context from document "${public_link.document_metadata.title}":
${context}`,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      },
    );

    if (!completion.ok) {
      throw new Error('Failed to generate AI response');
    }

    const completionData = await completion.json();
    const aiResponse = completionData.choices[0].message.content;

    // Insert AI response
    await insertChatMessageWithSession(
      documentId,
      'assistant',
      aiResponse,
      clientSession.id,
    );

    // Track AI response analytics
    await trackAnalyticsEvent({
      broker_id: public_link.broker_id,
      public_link_id: public_link.id,
      client_session_id: clientSession.id,
      event_type: 'chat_message',
      event_data: {
        message_type: 'assistant',
        message_length: aiResponse.length,
        chunks_used: relevantChunks.length,
      },
    });

    // Update client session activity
    await updateClientSessionActivity(
      clientSession.id,
      clientSession.total_messages + 2, // +2 for user and assistant messages
    );

    return NextResponse.json({
      success: true,
      response: aiResponse,
      chunks_used: relevantChunks.length,
    });
  } catch (error) {
    console.error('Error in public chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 },
    );
  }
}
