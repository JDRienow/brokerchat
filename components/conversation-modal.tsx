'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageIcon, UserIcon, CrossIcon } from '@/components/icons';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ClientSession {
  id: string;
  client_email: string;
  client_name: string | null;
  first_visit: string;
  last_activity: string;
  total_messages: number;
  public_link: {
    id: string;
    title: string;
    document_id: string;
    document_metadata: {
      title: string;
      created_at: string;
    };
  };
  chat_histories: ChatMessage[];
}

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  documentId: string;
  documentTitle: string;
}

export function ConversationModal({
  isOpen,
  onClose,
  email,
  documentId,
  documentTitle,
}: ConversationModalProps) {
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && email && documentId) {
      fetchSessions();
    }
  }, [isOpen, email, documentId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/broker/client-sessions/by-email?email=${encodeURIComponent(email)}&documentId=${documentId}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      console.log('Fetched sessions data:', data);
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageCount = (session: ClientSession) => {
    return session.chat_histories?.length || 0;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <AlertDialogTitle>Conversations for {email}</AlertDialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <CrossIcon size={16} />
            </Button>
          </div>
          <AlertDialogDescription>
            Document: {documentTitle}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={`skeleton-${i}-${Date.now()}`}
                  className="h-20 w-full"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchSessions} variant="outline">
              Try Again
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageIcon size={48} />
            <h3 className="text-lg font-semibold mb-2 mt-4">
              No conversations found
            </h3>
            <p className="text-muted-foreground">
              This client hasn&apos;t sent any messages yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">Session Details</h4>
                    <p className="text-sm text-muted-foreground">
                      First visit: {formatDate(session.first_visit)} | Last
                      activity: {formatDate(session.last_activity)} | Messages:{' '}
                      {getMessageCount(session)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {getMessageCount(session)} messages
                  </Badge>
                </div>

                {session.chat_histories && session.chat_histories.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {session.chat_histories.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {message.role === 'user'
                                ? 'Client'
                                : 'AI Assistant'}
                            </span>
                            <span className="text-xs opacity-70">
                              {formatMessageTime(message.created_at)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No messages in this session
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
