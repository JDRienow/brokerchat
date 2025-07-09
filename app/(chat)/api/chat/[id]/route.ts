import { type NextRequest, NextResponse } from 'next/server';
import {
  fetchDocumentMetadata,
  fetchChatHistory,
  insertChatMessage,
  vectorSimilaritySearch,
} from '@/lib/db/queries';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const documentId = params.id;
  let question: string;

  try {
    const body = await req.json();
    question = body.question;
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid question' },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 1. Fetch document metadata to ensure it exists
  const document = await fetchDocumentMetadata(documentId).catch(() => null);
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // 2. Get embedding for the question
  let embedding: number[];
  try {
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: question,
      }),
    });
    const embeddingJson = await embeddingRes.json();
    if (!embeddingRes.ok)
      throw new Error(embeddingJson.error?.message || 'Embedding error');
    embedding = embeddingJson.data[0].embedding;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Failed to get embedding: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // 3. Vector similarity search for relevant chunks
  let chunks: Array<{ content: string }> = [];
  try {
    chunks = await vectorSimilaritySearch(documentId, embedding, 5);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Vector search failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // 4. Build context from chunks
  const context = (chunks || []).map((c) => c.content).join(`\n---\n`);

  // 5. Call OpenAI chat completion
  let answer = '';
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
              content: `You are a helpful assistant for the document "${document.title}". Use only the provided context to answer.\n\nContext:\n${context}`,
            },
            {
              role: 'user',
              content: question,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      },
    );
    const completionJson = await completionRes.json();
    if (!completionRes.ok)
      throw new Error(completionJson.error?.message || 'Completion error');
    answer = completionJson.choices[0].message.content;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `OpenAI completion failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // 6. Save user question and AI answer to chat_histories
  try {
    await insertChatMessage(documentId, 'user', question);
    await insertChatMessage(documentId, 'assistant', answer);
  } catch (err: unknown) {
    // Don't block response if saving fails, but log error
    console.error('Failed to save chat history:', err);
  }

  return NextResponse.json({ answer });
}
