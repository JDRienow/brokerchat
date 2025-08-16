'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageIcon, UserIcon, ArrowLeftIcon } from '@/components/icons';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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

export default function ClientSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [sessionData, setSessionData] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.sessionId) {
      fetchSession();
    }
  }, [params.sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/broker/client-sessions/${params.sessionId}`,
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view this conversation.');
        } else if (response.status === 404) {
          setError('Conversation not found.');
        } else {
          setError('Failed to load conversation.');
        }
        return;
      }

      const data = await response.json();
      setSessionData(data.conversation);
    } catch (error) {
      console.error('Error fetching session:', error);
      setError('Failed to load conversation.');
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

  // SECURITY CHECK: Prevent brokers from accessing client session pages when logged in
  if (session?.user?.type === 'broker') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground mb-4">
                  You cannot access client session pages while logged in as a
                  broker.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  <ArrowLeftIcon size={16} />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton
                key={`message-skeleton-${Date.now()}-${i}`}
                className="h-20 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Error</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => router.push('/client-sessions')}>
                  <ArrowLeftIcon size={16} />
                  Back to Conversations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/client-sessions">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon size={16} />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Client Conversation</h1>
              <p className="text-muted-foreground">
                {sessionData.client_name || sessionData.client_email}
              </p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Client Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <UserIcon />
                    <span>{sessionData.client_name || 'No name provided'}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {sessionData.client_email}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Session Details</h4>
                <div className="space-y-1 text-sm">
                  <p>First visit: {formatDate(sessionData.first_visit)}</p>
                  <p>Last activity: {formatDate(sessionData.last_activity)}</p>
                  <p>
                    Total messages: {sessionData.chat_histories?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary">
                {sessionData.public_link.document_metadata.title}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionData.chat_histories &&
            sessionData.chat_histories.length > 0 ? (
              <div className="space-y-4">
                {sessionData.chat_histories.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
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
                          {message.role === 'user' ? 'Client' : 'AI Assistant'}
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
              <div className="text-center py-8">
                <MessageIcon size={48} />
                <h3 className="text-lg font-semibold mb-2 mt-4">
                  No messages yet
                </h3>
                <p className="text-muted-foreground">
                  This client hasn&apos;t sent any messages yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
