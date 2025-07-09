import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch all chat history for a given document_id
export async function fetchChatHistory(documentId: string) {
  const { data, error } = await supabase
    .from('chat_histories')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Insert a new chat message for a document
export async function insertChatMessage(
  documentId: string,
  role: string,
  content: string,
) {
  const { data, error } = await supabase
    .from('chat_histories')
    .insert([
      {
        document_id: documentId,
        role,
        content,
      },
    ])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Vector similarity search for document chunks using pgvector
export async function vectorSimilaritySearch(
  documentId: string,
  embedding: number[],
  k = 5,
) {
  // First try the RPC function for vector search
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: k,
    file_id: documentId,
  });

  console.log('Vector search RPC result:', {
    documentId,
    data,
    error,
    dataLength: data?.length,
  });

  if (error) {
    console.log(
      'RPC function failed, checking if documents exist with basic query...',
    );

    // Fallback: check if any documents exist for this file_id
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('documents')
      .select('*')
      .eq('file_id', documentId)
      .limit(k);

    console.log('Fallback query result:', {
      documentId,
      fallbackData,
      fallbackError,
      count: fallbackData?.length,
    });

    if (fallbackError) {
      console.error('Both RPC and fallback failed:', { error, fallbackError });
      throw fallbackError;
    }

    return fallbackData || [];
  }

  return data || [];
}

// Fetch document metadata by id
export async function fetchDocumentMetadata(documentId: string) {
  const { data, error } = await supabase
    .from('document_metadata')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();
  console.log('fetchDocumentMetadata:', { documentId, data, error });
  if (error) throw error;
  return data;
}

// Insert document metadata
export async function insertDocumentMetadata(title: string, url: string) {
  const { data, error } = await supabase
    .from('document_metadata')
    .insert([{ title, url }])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Insert document chunk with metadata (for n8n/LangChain compatibility)
/**
 * Inserts a document chunk into the documents table, including metadata for LangChain compatibility.
 * @param fileId - The file/document id (uuid)
 * @param content - The text chunk
 * @param embedding - The embedding vector (1536-dim)
 * @param chunkIndex - The chunk index (integer)
 * @param metadata - Optional metadata object (will be stored as jsonb)
 */
export async function insertDocumentChunk(
  fileId: string,
  content: string,
  embedding: number[],
  chunkIndex: number,
  metadata?: any,
) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      file_id: fileId,
      content,
      embedding,
      chunk_index: chunkIndex,
      metadata: metadata || {
        file_id: fileId,
        chunk_index: chunkIndex,
        source: 'pdf',
      },
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Minimal auth compatibility exports for MVP (no-op)
export async function createGuestUser() {
  // Return a dummy guest user object
  return [
    {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      email: null,
      type: 'guest',
    },
  ];
}

export async function getUser(email: string) {
  // Return empty array for MVP (no user storage)
  return [];
}

// Get message by ID (from chat_histories table)
export async function getMessageById({ id }: { id: string }) {
  const { data, error } = await supabase
    .from('chat_histories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return [];
  return [{ ...data, chatId: data.document_id, createdAt: data.created_at }]; // Return as array with compatible format
}

// Delete messages by document ID after timestamp
export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const { error } = await supabase
    .from('chat_histories')
    .delete()
    .eq('document_id', chatId) // Use document_id instead of chat_id
    .gte('created_at', timestamp.toISOString());
  if (error) throw error;
}

// Update chat visibility by ID (not supported in current schema, no-op for compatibility)
export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: string;
}) {
  // No-op since document_metadata doesn't have visibility field
  // Could add this field if needed in the future
  console.log(
    `Visibility update requested for ${chatId}: ${visibility} (not implemented)`,
  );
}

// Get documents/chats by user ID with pagination (using document_metadata table)
export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}) {
  // Since we don't have user association in document_metadata,
  // return all documents for now (for MVP)
  let query = supabase
    .from('document_metadata')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Handle pagination
  if (startingAfter) {
    const { data: afterDoc, error } = await supabase
      .from('document_metadata')
      .select('created_at')
      .eq('id', startingAfter)
      .maybeSingle();

    if (!error && afterDoc) {
      query = query.lt('created_at', afterDoc.created_at);
    }
  }

  if (endingBefore) {
    const { data: beforeDoc, error } = await supabase
      .from('document_metadata')
      .select('created_at')
      .eq('id', endingBefore)
      .maybeSingle();

    if (!error && beforeDoc) {
      query = query.gt('created_at', beforeDoc.created_at);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  // Transform to match expected Chat format
  return (data || []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    createdAt: doc.created_at,
    userId: id, // Fake user association for compatibility
    visibility: 'private',
  }));
}

// ==================== BROKER FUNCTIONS ====================

// Get broker by email
export async function getBrokerByEmail(email: string) {
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Get broker by ID
export async function getBrokerById(id: string) {
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Create new broker
export async function createBroker(brokerData: {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  phone?: string;
  subscription_tier?: string;
}) {
  const { data, error } = await supabase
    .from('brokers')
    .insert([brokerData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update broker
export async function updateBroker(
  id: string,
  updates: Partial<{
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    subscription_tier: string;
    subscription_status: string;
  }>,
) {
  const { data, error } = await supabase
    .from('brokers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get broker's documents
export async function getBrokerDocuments(brokerId: string) {
  const { data, error } = await supabase
    .from('document_metadata')
    .select(`
      *,
      documents:documents(count)
    `)
    .eq('broker_id', brokerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ==================== PUBLIC LINK FUNCTIONS ====================

// Create public link for document
export async function createPublicLink(linkData: {
  document_id: string;
  broker_id: string;
  title: string;
  description?: string;
  requires_email?: boolean;
  custom_branding?: any;
}) {
  const public_token = `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const { data, error } = await supabase
    .from('public_links')
    .insert([{ ...linkData, public_token }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get public link by token
export async function getPublicLinkByToken(token: string) {
  const { data, error } = await supabase
    .from('public_links')
    .select(`
      *,
      document_metadata:document_metadata(*),
      broker:brokers(first_name, last_name, company_name)
    `)
    .eq('public_token', token)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Get broker's public links
export async function getBrokerPublicLinks(brokerId: string) {
  const { data, error } = await supabase
    .from('public_links')
    .select(`
      *,
      document_metadata:document_metadata(title, created_at),
      client_sessions:client_sessions(count)
    `)
    .eq('broker_id', brokerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Update public link
export async function updatePublicLink(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    is_active: boolean;
    requires_email: boolean;
    custom_branding: any;
  }>,
) {
  const { data, error } = await supabase
    .from('public_links')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete public link
export async function deletePublicLink(id: string) {
  const { error } = await supabase.from('public_links').delete().eq('id', id);
  if (error) throw error;
}

// ==================== CLIENT SESSION FUNCTIONS ====================

// Create client session
export async function createClientSession(sessionData: {
  public_link_id: string;
  client_email: string;
  client_name?: string;
  client_phone?: string;
}) {
  const session_token = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const { data, error } = await supabase
    .from('client_sessions')
    .insert([{ ...sessionData, session_token }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get client session by token
export async function getClientSessionByToken(token: string) {
  const { data, error } = await supabase
    .from('client_sessions')
    .select(`
      *,
      public_link:public_links(
        *,
        document_metadata:document_metadata(*),
        broker:brokers(first_name, last_name, company_name)
      )
    `)
    .eq('session_token', token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Update client session activity
export async function updateClientSessionActivity(
  sessionId: string,
  messageCount?: number,
) {
  const updates = { last_activity: new Date().toISOString() } as any;
  if (messageCount !== undefined) {
    updates.total_messages = messageCount;
  }

  const { data, error } = await supabase
    .from('client_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get public link's client sessions
export async function getPublicLinkClientSessions(publicLinkId: string) {
  const { data, error } = await supabase
    .from('client_sessions')
    .select('*')
    .eq('public_link_id', publicLinkId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ==================== ANALYTICS FUNCTIONS ====================

// Track analytics event
export async function trackAnalyticsEvent(eventData: {
  broker_id: string;
  public_link_id?: string;
  client_session_id?: string;
  event_type:
    | 'link_view'
    | 'email_capture'
    | 'chat_message'
    | 'document_download';
  event_data?: any;
}) {
  const { data, error } = await supabase
    .from('analytics')
    .insert([eventData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get broker analytics
export async function getBrokerAnalytics(brokerId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('broker_id', brokerId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Get public link analytics
export async function getPublicLinkAnalytics(
  publicLinkId: string,
  days: number = 30,
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('public_link_id', publicLinkId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ==================== ENHANCED DOCUMENT FUNCTIONS ====================

// Insert document metadata with broker association
export async function insertDocumentMetadataWithBroker(
  title: string,
  url: string,
  brokerId: string,
) {
  const { data, error } = await supabase
    .from('document_metadata')
    .insert([{ title, url, broker_id: brokerId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Insert chat message with client session
export async function insertChatMessageWithSession(
  documentId: string,
  role: string,
  content: string,
  clientSessionId?: string,
) {
  const insertData = {
    document_id: documentId,
    role,
    content,
  } as any;

  if (clientSessionId) {
    insertData.client_session_id = clientSessionId;
  }

  const { data, error } = await supabase
    .from('chat_histories')
    .insert([insertData])
    .select()
    .single();
  if (error) throw error;
  return data;
}
