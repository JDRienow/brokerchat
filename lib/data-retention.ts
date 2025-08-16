import { supabaseAdmin } from '@/lib/db/queries';
import { deleteFileFromStorage } from '@/lib/supabase-storage';

// Data retention configuration
export interface RetentionConfig {
  documents: {
    daysToKeep: number;
    description: string;
  };
  chatHistories: {
    daysToKeep: number;
    description: string;
  };
  clientSessions: {
    daysToKeep: number;
    description: string;
  };
  analytics: {
    daysToKeep: number;
    description: string;
  };
  errorLogs: {
    daysToKeep: number;
    description: string;
  };
}

// Default retention periods
export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  documents: {
    daysToKeep: 30,
    description: 'Documents are deleted after 30 days',
  },
  chatHistories: {
    daysToKeep: 7,
    description: 'Chat histories are deleted after 7 days',
  },
  clientSessions: {
    daysToKeep: 90,
    description: 'Client sessions are deleted after 90 days',
  },
  analytics: {
    daysToKeep: 365,
    description: 'Analytics are deleted after 1 year',
  },
  errorLogs: {
    daysToKeep: 30,
    description: 'Error logs are deleted after 30 days',
  },
};

// Get retention config from environment or use defaults
export function getRetentionConfig(): RetentionConfig {
  return {
    documents: {
      daysToKeep:
        Number(process.env.DOCUMENT_RETENTION_DAYS) ||
        DEFAULT_RETENTION_CONFIG.documents.daysToKeep,
      description: DEFAULT_RETENTION_CONFIG.documents.description,
    },
    chatHistories: {
      daysToKeep:
        Number(process.env.CHAT_RETENTION_DAYS) ||
        DEFAULT_RETENTION_CONFIG.chatHistories.daysToKeep,
      description: DEFAULT_RETENTION_CONFIG.chatHistories.description,
    },
    clientSessions: {
      daysToKeep:
        Number(process.env.SESSION_RETENTION_DAYS) ||
        DEFAULT_RETENTION_CONFIG.clientSessions.daysToKeep,
      description: DEFAULT_RETENTION_CONFIG.clientSessions.description,
    },
    analytics: {
      daysToKeep:
        Number(process.env.ANALYTICS_RETENTION_DAYS) ||
        DEFAULT_RETENTION_CONFIG.analytics.daysToKeep,
      description: DEFAULT_RETENTION_CONFIG.analytics.description,
    },
    errorLogs: {
      daysToKeep:
        Number(process.env.ERROR_LOG_RETENTION_DAYS) ||
        DEFAULT_RETENTION_CONFIG.errorLogs.daysToKeep,
      description: DEFAULT_RETENTION_CONFIG.errorLogs.description,
    },
  };
}

// Calculate cutoff date for data retention
function getCutoffDate(daysToKeep: number): Date {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  return cutoffDate;
}

// Clean up old documents and their chunks
export async function cleanupOldDocuments() {
  const config = getRetentionConfig();
  const cutoffDate = getCutoffDate(config.documents.daysToKeep);

  console.log(
    `🧹 Cleaning up documents older than ${cutoffDate.toISOString()}`,
  );

  try {
    // Get old documents
    const { data: oldDocuments, error: docsError } = await supabaseAdmin
      .from('document_metadata')
      .select('id, title, url, storage_path')
      .lt('created_at', cutoffDate.toISOString());

    if (docsError) {
      console.error('Error fetching old documents:', docsError);
      return { success: false, error: docsError };
    }

    if (!oldDocuments || oldDocuments.length === 0) {
      console.log('No old documents to clean up');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${oldDocuments.length} old documents to delete`);

    // Delete document chunks first
    for (const doc of oldDocuments) {
      const { error: chunksError } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('file_id', doc.id);

      if (chunksError) {
        console.error(
          `Error deleting chunks for document ${doc.id}:`,
          chunksError,
        );
      }
    }

    // Delete associated public links
    const documentIds = oldDocuments.map((doc) => doc.id);
    const { error: linksError } = await supabaseAdmin
      .from('public_links')
      .delete()
      .in('document_id', documentIds);

    if (linksError) {
      console.error('Error deleting public links:', linksError);
    }

    // Delete client sessions for these documents
    const { error: sessionsError } = await supabaseAdmin
      .from('client_sessions')
      .delete()
      .in('public_link_id', documentIds);

    if (sessionsError) {
      console.error('Error deleting client sessions:', sessionsError);
    }

    // Delete chat histories for these documents
    const { error: chatError } = await supabaseAdmin
      .from('chat_histories')
      .delete()
      .in('document_id', documentIds);

    if (chatError) {
      console.error('Error deleting chat histories:', chatError);
    }

    // Delete files from Supabase Storage
    for (const doc of oldDocuments) {
      if (doc.storage_path) {
        try {
          await deleteFileFromStorage(doc.storage_path);
          console.log(`Deleted file from storage: ${doc.storage_path}`);
        } catch (storageError) {
          console.error(
            `Error deleting file from storage: ${doc.storage_path}`,
            storageError,
          );
        }
      }
    }

    // Finally, delete the document metadata
    const { error: metadataError } = await supabaseAdmin
      .from('document_metadata')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (metadataError) {
      console.error('Error deleting document metadata:', metadataError);
      return { success: false, error: metadataError };
    }

    console.log(
      `✅ Successfully cleaned up ${oldDocuments.length} old documents`,
    );
    return { success: true, deletedCount: oldDocuments.length };
  } catch (error) {
    console.error('Error in cleanupOldDocuments:', error);
    return { success: false, error };
  }
}

// Clean up old chat histories
export async function cleanupOldChatHistories() {
  const config = getRetentionConfig();
  const cutoffDate = getCutoffDate(config.chatHistories.daysToKeep);

  console.log(
    `🧹 Cleaning up chat histories older than ${cutoffDate.toISOString()}`,
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('chat_histories')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up chat histories:', error);
      return { success: false, error };
    }

    const deletedCount = data?.length || 0;
    console.log(
      `✅ Successfully cleaned up ${deletedCount} old chat histories`,
    );
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in cleanupOldChatHistories:', error);
    return { success: false, error };
  }
}

// Clean up old client sessions
export async function cleanupOldClientSessions() {
  const config = getRetentionConfig();
  const cutoffDate = getCutoffDate(config.clientSessions.daysToKeep);

  console.log(
    `🧹 Cleaning up client sessions older than ${cutoffDate.toISOString()}`,
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('client_sessions')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up client sessions:', error);
      return { success: false, error };
    }

    const deletedCount = data?.length || 0;
    console.log(
      `✅ Successfully cleaned up ${deletedCount} old client sessions`,
    );
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in cleanupOldClientSessions:', error);
    return { success: false, error };
  }
}

// Clean up old analytics
export async function cleanupOldAnalytics() {
  const config = getRetentionConfig();
  const cutoffDate = getCutoffDate(config.analytics.daysToKeep);

  console.log(
    `🧹 Cleaning up analytics older than ${cutoffDate.toISOString()}`,
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('analytics')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up analytics:', error);
      return { success: false, error };
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Successfully cleaned up ${deletedCount} old analytics`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in cleanupOldAnalytics:', error);
    return { success: false, error };
  }
}

// Clean up old error logs
export async function cleanupOldErrorLogs() {
  const config = getRetentionConfig();
  const cutoffDate = getCutoffDate(config.errorLogs.daysToKeep);

  console.log(
    `🧹 Cleaning up error logs older than ${cutoffDate.toISOString()}`,
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('error_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up error logs:', error);
      return { success: false, error };
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Successfully cleaned up ${deletedCount} old error logs`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in cleanupOldErrorLogs:', error);
    return { success: false, error };
  }
}

// Run all cleanup operations
export async function runDataRetentionCleanup() {
  console.log('🚀 Starting data retention cleanup...');

  const results = {
    documents: await cleanupOldDocuments(),
    chatHistories: await cleanupOldChatHistories(),
    clientSessions: await cleanupOldClientSessions(),
    analytics: await cleanupOldAnalytics(),
    errorLogs: await cleanupOldErrorLogs(),
  };

  const totalDeleted = Object.values(results).reduce((sum, result) => {
    return sum + (result.deletedCount || 0);
  }, 0);

  console.log(
    `🎉 Data retention cleanup completed. Total records deleted: ${totalDeleted}`,
  );

  return {
    success: Object.values(results).every((r) => r.success),
    results,
    totalDeleted,
  };
}

// Get storage usage statistics
export async function getStorageStats() {
  try {
    // Get document count and metadata
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('document_metadata')
      .select('id, created_at, chunk_count');

    if (docsError) throw docsError;

    // Get chat history count
    const { count: chatCount, error: chatError } = await supabaseAdmin
      .from('chat_histories')
      .select('*', { count: 'exact', head: true });

    if (chatError) throw chatError;

    // Get client session count
    const { count: sessionCount, error: sessionError } = await supabaseAdmin
      .from('client_sessions')
      .select('*', { count: 'exact', head: true });

    if (sessionError) throw sessionError;

    // Get analytics count
    const { count: analyticsCount, error: analyticsError } = await supabaseAdmin
      .from('analytics')
      .select('*', { count: 'exact', head: true });

    if (analyticsError) throw analyticsError;

    // Get error logs count
    const { count: errorLogsCount, error: errorLogsError } = await supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact', head: true });

    if (errorLogsError) throw errorLogsError;

    // Calculate estimated storage based on chunk count and data types
    const totalChunks =
      documents?.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0) || 0;
    const estimatedDocumentSizeMB = totalChunks * 0.05; // ~50KB per chunk

    return {
      documents: {
        count: documents?.length || 0,
        totalChunks: totalChunks,
        estimatedSizeMB: estimatedDocumentSizeMB,
        oldestDocument:
          documents?.length > 0
            ? Math.min(
                ...documents.map((d) => new Date(d.created_at).getTime()),
              )
            : null,
      },
      chatHistories: {
        count: chatCount || 0,
      },
      clientSessions: {
        count: sessionCount || 0,
      },
      analytics: {
        count: analyticsCount || 0,
      },
      errorLogs: {
        count: errorLogsCount || 0,
      },
      estimatedStorageMB:
        estimatedDocumentSizeMB +
        (chatCount || 0) * 0.01 +
        (sessionCount || 0) * 0.005 +
        (analyticsCount || 0) * 0.002 +
        (errorLogsCount || 0) * 0.001,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
}
