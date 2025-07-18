import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  if (error) {
    // Fallback: check if any documents exist for this file_id
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('documents')
      .select('*')
      .eq('file_id', documentId)
      .limit(k);

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

// Broker app doesn't use guest users - removed createGuestUser function

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
  // SECURITY FIX: Only return documents that belong to this specific broker
  let query = supabase
    .from('document_metadata')
    .select('*')
    .eq('broker_id', id) // Filter by broker_id to ensure data isolation
    .order('created_at', { ascending: false })
    .limit(limit);

  // Handle pagination
  if (startingAfter) {
    const { data: afterDoc, error } = await supabase
      .from('document_metadata')
      .select('created_at')
      .eq('id', startingAfter)
      .eq('broker_id', id) // Also filter pagination queries
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
      .eq('broker_id', id) // Also filter pagination queries
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
    userId: id,
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

// Update broker password
export async function updateBrokerPassword(id: string, passwordHash: string) {
  const { data, error } = await supabase
    .from('brokers')
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Create password reset token
export async function createPasswordResetToken(email: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

  const { data, error } = await supabase
    .from('brokers')
    .update({
      reset_token: token,
      reset_token_expires: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', email)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get broker by reset token
export async function getBrokerByResetToken(token: string) {
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('reset_token', token)
    .gt('reset_token_expires', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Clear password reset token
export async function clearPasswordResetToken(id: string) {
  const { data, error } = await supabase
    .from('brokers')
    .update({
      reset_token: null,
      reset_token_expires: null,
      updated_at: new Date().toISOString(),
    })
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
    .select('*')
    .eq('broker_id', brokerId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // For each document, get chunk count separately
  const documentsWithChunks = await Promise.all(
    (data || []).map(async (doc) => {
      const { data: chunks, error: chunkError } = await supabase
        .from('documents')
        .select('id')
        .eq('file_id', doc.id);

      const chunkCount = chunkError ? 0 : chunks?.length || 0;

      return {
        ...doc,
        chunk_count: chunkCount,
      };
    }),
  );

  return documentsWithChunks;
}

// ==================== PUBLIC LINK FUNCTIONS ====================

// Check if public link already exists for document
export async function getPublicLinkByDocumentId(documentId: string) {
  const { data, error } = await supabase
    .from('public_links')
    .select('*')
    .eq('document_id', documentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Create public link for document (only if one doesn't exist)
export async function createPublicLink(linkData: {
  document_id: string;
  broker_id: string;
  title: string;
  description?: string;
  requires_email?: boolean;
  custom_branding?: any;
}) {
  // Check if a public link already exists for this document
  const existingLink = await getPublicLinkByDocumentId(linkData.document_id);

  if (existingLink) {
    throw new Error(
      'A public link already exists for this document. Only one link per document is allowed.',
    );
  }

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

// Delete document and all related data
export async function deleteDocumentAndRelatedData(documentId: string) {
  try {
    // First, get all public link IDs for this document
    const { data: publicLinkIds, error: linkError } = await supabase
      .from('public_links')
      .select('id')
      .eq('document_id', documentId);

    if (linkError) {
      console.error('Error fetching public links for deletion:', linkError);
      throw linkError;
    }

    if (publicLinkIds && publicLinkIds.length > 0) {
      const linkIds = publicLinkIds.map((link) => link.id);

      // Delete analytics events for these public links
      const { error: analyticsError } = await supabase
        .from('analytics')
        .delete()
        .in('public_link_id', linkIds);

      if (analyticsError) {
        console.error('Error deleting analytics events:', analyticsError);
        // Continue with deletion even if analytics cleanup fails
      }

      // Delete client sessions for these public links
      const { error: sessionsError } = await supabase
        .from('client_sessions')
        .delete()
        .in('public_link_id', linkIds);

      if (sessionsError) {
        console.error('Error deleting client sessions:', sessionsError);
        // Continue with deletion
      }

      // Delete chat histories for these public links
      const { data: chatHistories, error: chatHistoryFetchError } =
        await supabase
          .from('chat_histories')
          .select('id')
          .eq('document_id', documentId);

      if (chatHistoryFetchError) {
        console.error('Error fetching chat histories:', chatHistoryFetchError);
      } else if (chatHistories && chatHistories.length > 0) {
        const { error: chatHistoryError } = await supabase
          .from('chat_histories')
          .delete()
          .eq('document_id', documentId);

        if (chatHistoryError) {
          console.error('Error deleting chat histories:', chatHistoryError);
        }
      }

      // Delete public links
      const { error: publicLinksError } = await supabase
        .from('public_links')
        .delete()
        .eq('document_id', documentId);

      if (publicLinksError) {
        console.error('Error deleting public links:', publicLinksError);
        throw publicLinksError;
      }
    }

    // Delete document chunks
    const { error: chunksError } = await supabase
      .from('documents')
      .delete()
      .eq('file_id', documentId);

    if (chunksError) {
      console.error('Error deleting document chunks:', chunksError);
      throw chunksError;
    }

    // Delete document metadata
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .delete()
      .eq('id', documentId);

    if (metadataError) {
      console.error('Error deleting document metadata:', metadataError);
      throw metadataError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteDocumentAndRelatedData:', error);
    throw error;
  }
}

// ==================== CLIENT SESSION FUNCTIONS ====================

// Create or get existing client session
export async function createClientSession(sessionData: {
  public_link_id: string;
  client_email: string;
  client_name?: string;
  client_phone?: string;
}) {
  try {
    // Check if session already exists for this email and public link
    const { data: existingSession, error: searchError } = await supabase
      .from('client_sessions')
      .select('*')
      .eq('public_link_id', sessionData.public_link_id)
      .eq('client_email', sessionData.client_email)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for existing session:', searchError);
      throw searchError;
    }

    if (existingSession) {
      // Update existing session's last_activity timestamp
      const { data, error } = await supabase
        .from('client_sessions')
        .update({
          last_activity: new Date().toISOString(),
          ...(sessionData.client_name && {
            client_name: sessionData.client_name,
          }),
          ...(sessionData.client_phone && {
            client_phone: sessionData.client_phone,
          }),
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating existing session:', error);
        throw error;
      }

      return data;
    }

    // Create new session if none exists
    const { data, error } = await supabase
      .from('client_sessions')
      .insert({
        ...sessionData,
        session_token: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        // created_at, first_visit, last_activity, total_messages have defaults in schema
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client session:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createClientSession:', error);
    throw error;
  }
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
  const updates = { last_activity: new Date().toISOString() };
  if (messageCount !== undefined) {
    (updates as any).total_messages = messageCount;
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

// Get chat history for client session
export async function getClientSessionChatHistory(clientSessionId: string) {
  const { data, error } = await supabase
    .from('chat_histories')
    .select('*')
    .eq('client_session_id', clientSessionId)
    .order('created_at', { ascending: true });
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
    | 'document_download'
    | 'user_login'
    | 'user_registration'
    | 'user_logout'
    | 'document_upload'
    | 'document_delete'
    | 'public_link_create'
    | 'public_link_delete'
    | 'profile_update'
    | 'password_reset_request'
    | 'password_reset_complete'
    | 'document_chat_start'
    | 'document_download_attempt'
    | 'error_occurred';
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

// ==================== ANALYTICS UTILITY FUNCTIONS ====================

// Safely track analytics event (won't throw errors)
export async function trackAnalyticsEventSafely(eventData: {
  broker_id: string;
  public_link_id?: string;
  client_session_id?: string;
  event_type:
    | 'link_view'
    | 'email_capture'
    | 'chat_message'
    | 'document_download'
    | 'user_login'
    | 'user_registration'
    | 'user_logout'
    | 'document_upload'
    | 'document_delete'
    | 'public_link_create'
    | 'public_link_delete'
    | 'profile_update'
    | 'password_reset_request'
    | 'password_reset_complete'
    | 'document_chat_start'
    | 'document_download_attempt'
    | 'error_occurred';
  event_data?: any;
}) {
  try {
    return await trackAnalyticsEvent(eventData);
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return null;
  }
}

// Track user action analytics
export async function trackUserAction(
  brokerId: string,
  action: 'login' | 'logout' | 'registration' | 'profile_update',
  metadata?: any,
) {
  const eventTypeMap = {
    login: 'user_login',
    logout: 'user_logout',
    registration: 'user_registration',
    profile_update: 'profile_update',
  } as const;

  return trackAnalyticsEventSafely({
    broker_id: brokerId,
    event_type: eventTypeMap[action],
    event_data: metadata,
  });
}

// Track document action analytics
export async function trackDocumentAction(
  brokerId: string,
  documentId: string,
  action: 'upload' | 'delete' | 'chat_start' | 'download_attempt',
  metadata?: any,
) {
  const eventTypeMap = {
    upload: 'document_upload',
    delete: 'document_delete',
    chat_start: 'document_chat_start',
    download_attempt: 'document_download_attempt',
  } as const;

  return trackAnalyticsEventSafely({
    broker_id: brokerId,
    event_type: eventTypeMap[action],
    event_data: { document_id: documentId, ...metadata },
  });
}

// Track public link action analytics
export async function trackPublicLinkAction(
  brokerId: string,
  publicLinkId: string,
  action: 'create' | 'delete',
  metadata?: any,
) {
  const eventTypeMap = {
    create: 'public_link_create',
    delete: 'public_link_delete',
  } as const;

  return trackAnalyticsEventSafely({
    broker_id: brokerId,
    public_link_id: publicLinkId,
    event_type: eventTypeMap[action],
    event_data: metadata,
  });
}

// Track password reset analytics
export async function trackPasswordResetAction(
  brokerId: string,
  action: 'request' | 'complete',
  metadata?: any,
) {
  const eventTypeMap = {
    request: 'password_reset_request',
    complete: 'password_reset_complete',
  } as const;

  return trackAnalyticsEventSafely({
    broker_id: brokerId,
    event_type: eventTypeMap[action],
    event_data: metadata,
  });
}

// Track analytics view actions (using user_login as allowed event type)
export async function trackAnalyticsView(
  brokerId: string,
  viewType: 'analytics' | 'email_analytics',
  metadata?: any,
) {
  return trackAnalyticsEventSafely({
    broker_id: brokerId,
    event_type: 'user_login', // Use allowed event type
    event_data: {
      action: `${viewType}_view`,
      ...metadata,
    },
  });
}

// Track error occurrences
export async function trackError(
  brokerId: string,
  error: Error,
  context?: string,
  metadata?: any,
) {
  return trackAnalyticsEventSafely({
    broker_id: brokerId,
    event_type: 'error_occurred',
    event_data: {
      error_message: error.message,
      error_stack: error.stack,
      context,
      ...metadata,
    },
  });
}

// Get broker analytics
export async function getBrokerAnalytics(brokerId: string, days = 30) {
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

// Get unique email captures per document for broker
export async function getBrokerUniqueEmailsPerDocument(brokerId: string) {
  const { data, error } = await supabase
    .from('client_sessions')
    .select(`
      client_email,
      client_name,
      created_at,
      public_link:public_links!inner(
        document_id,
        broker_id,
        document_metadata(title)
      )
    `)
    .eq('public_link.broker_id', brokerId);

  if (error) throw error;

  // Group by document and email, count accesses and get first access date
  const emailsPerDocument = new Map();
  data?.forEach((session: any) => {
    const documentId = session.public_link?.document_id;
    const documentTitle = session.public_link?.document_metadata?.[0]?.title;
    const email = session.client_email;
    const name = session.client_name;
    const createdAt = session.created_at;
    if (documentId && email) {
      if (!emailsPerDocument.has(documentId)) {
        emailsPerDocument.set(documentId, {
          document_id: documentId,
          document_title: documentTitle,
          emails: new Map(),
        });
      }
      const docEntry = emailsPerDocument.get(documentId);
      if (!docEntry.emails.has(email)) {
        docEntry.emails.set(email, {
          email,
          name,
          first_accessed: createdAt,
          access_count: 1,
        });
      } else {
        const emailEntry = docEntry.emails.get(email);
        emailEntry.access_count += 1;
        // Update first_accessed if this session is earlier
        if (createdAt < emailEntry.first_accessed) {
          emailEntry.first_accessed = createdAt;
        }
        docEntry.emails.set(email, emailEntry);
      }
    }
  });

  // Convert to array with counts
  return Array.from(emailsPerDocument.values()).map((doc) => ({
    document_id: doc.document_id,
    document_title: doc.document_title,
    emails: Array.from(doc.emails.values()),
    total_unique_emails: doc.emails.size,
  }));
}

// Get public link analytics
export async function getPublicLinkAnalytics(publicLinkId: string, days = 30) {
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

// Get comprehensive broker analytics
export async function getComprehensiveBrokerAnalytics(
  brokerId: string,
  days = 30,
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('broker_id', brokerId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Process analytics data
  const analytics = data || [];
  const eventCounts = analytics.reduce(
    (acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get daily breakdown
  const dailyBreakdown = analytics.reduce(
    (acc, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = {};
      acc[date][event.event_type] = (acc[date][event.event_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, Record<string, number>>,
  );

  return {
    totalEvents: analytics.length,
    eventCounts,
    dailyBreakdown,
    recentEvents: analytics.slice(0, 50),
  };
}

// Get broker usage statistics
export async function getBrokerUsageStats(brokerId: string) {
  try {
    // Get document count
    const { data: documents, error: docsError } = await supabase
      .from('document_metadata')
      .select('id, created_at')
      .eq('broker_id', brokerId);

    if (docsError) throw docsError;

    // Get public links count
    const { data: publicLinks, error: linksError } = await supabase
      .from('public_links')
      .select('id, is_active, created_at')
      .eq('broker_id', brokerId);

    if (linksError) throw linksError;

    // Get unique email captures
    const { data: emailCaptures, error: emailError } = await supabase
      .from('client_sessions')
      .select('client_email, public_link:public_links!inner(broker_id)')
      .eq('public_link.broker_id', brokerId);

    if (emailError) throw emailError;

    // Get recent analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentAnalytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('event_type, created_at')
      .eq('broker_id', brokerId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (analyticsError) throw analyticsError;

    // Calculate stats
    const totalDocuments = documents?.length || 0;
    const totalPublicLinks = publicLinks?.length || 0;
    const activePublicLinks =
      publicLinks?.filter((link) => link.is_active).length || 0;
    const uniqueEmails = new Set(emailCaptures?.map((ec) => ec.client_email))
      .size;

    // Recent activity stats
    const recentEventCounts = (recentAnalytics || []).reduce(
      (acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalDocuments,
      totalPublicLinks,
      activePublicLinks,
      uniqueEmails,
      recentActivity: {
        totalEvents: recentAnalytics?.length || 0,
        logins: recentEventCounts.user_login || 0,
        documentUploads: recentEventCounts.document_upload || 0,
        linkViews: recentEventCounts.link_view || 0,
        chatMessages: recentEventCounts.chat_message || 0,
        emailCaptures: recentEventCounts.email_capture || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching broker usage stats:', error);
    throw error;
  }
}

// Get analytics trends (compare current period vs previous period)
export async function getAnalyticsTrends(brokerId: string, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const previousEndDate = new Date(startDate);
  const previousStartDate = new Date();
  previousStartDate.setDate(previousStartDate.getDate() - days * 2);

  try {
    // Get current period analytics
    const { data: currentPeriod, error: currentError } = await supabase
      .from('analytics')
      .select('event_type, created_at')
      .eq('broker_id', brokerId)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    if (currentError) throw currentError;

    // Get previous period analytics
    const { data: previousPeriod, error: previousError } = await supabase
      .from('analytics')
      .select('event_type, created_at')
      .eq('broker_id', brokerId)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString());

    if (previousError) throw previousError;

    // Calculate metrics for both periods
    const calculateMetrics = (data: any[]) => {
      const events = data || [];
      return events.reduce(
        (acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    };

    const currentMetrics = calculateMetrics(currentPeriod);
    const previousMetrics = calculateMetrics(previousPeriod);

    // Calculate percentage changes
    const trends = Object.keys({
      ...currentMetrics,
      ...previousMetrics,
    }).reduce(
      (acc, eventType) => {
        const current = currentMetrics[eventType] || 0;
        const previous = previousMetrics[eventType] || 0;
        const change =
          previous === 0
            ? current > 0
              ? 100
              : 0
            : ((current - previous) / previous) * 100;

        acc[eventType] = {
          current,
          previous,
          change: Math.round(change * 100) / 100,
        };
        return acc;
      },
      {} as Record<
        string,
        { current: number; previous: number; change: number }
      >,
    );

    return trends;
  } catch (error) {
    console.error('Error fetching analytics trends:', error);
    throw error;
  }
}

// ==================== ENHANCED DOCUMENT FUNCTIONS ====================

// Insert document metadata with broker association
export async function insertDocumentMetadataWithBroker(
  title: string,
  url: string,
  brokerId: string,
  storageUrl?: string,
) {
  const insertData: any = { title, url, broker_id: brokerId };

  // Add storage_url if provided (for Supabase Storage files)
  if (storageUrl) {
    insertData.storage_url = storageUrl;
  }

  const { data, error } = await supabase
    .from('document_metadata')
    .insert([insertData])
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
