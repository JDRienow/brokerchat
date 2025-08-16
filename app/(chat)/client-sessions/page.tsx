'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageIcon, UserIcon, ClockRewind } from '@/components/icons';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
  chat_histories: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }>;
}

export default function ClientSessionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchEmail) params.append('searchEmail', searchEmail);
      if (selectedDocument) params.append('documentId', selectedDocument);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/broker/client-sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data.clientSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
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

  const getMessageCount = (session: ClientSession) => {
    return session.chat_histories?.length || 0;
  };

  // SECURITY CHECK: Prevent brokers from accessing client sessions page when logged in
  if (session?.user?.type === 'broker') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground mb-4">
                  You cannot access client sessions while logged in as a broker.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton
                key={`session-skeleton-${Date.now()}-${i}`}
                className="h-32 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Conversations</h1>
            <p className="text-muted-foreground">
              View and manage conversations with your document visitors
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="searchEmail">Search by Email</Label>
                <Input
                  id="searchEmail"
                  placeholder="client@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="selectedDocument">Document</Label>
                <Input
                  id="selectedDocument"
                  placeholder="Document ID"
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={fetchSessions} className="w-full md:w-auto">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 text-muted-foreground">
                    <MessageIcon size={48} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No conversations found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchEmail || selectedDocument || dateFrom || dateTo
                      ? 'Try adjusting your filters to see more results.'
                      : 'Start sharing your documents to see client conversations here.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card
                key={session.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <UserIcon />
                        <div>
                          <h3 className="font-semibold">
                            {session.client_name || 'Anonymous'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {session.client_email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          <ClockRewind size={14} />
                          {formatDate(session.last_activity)}
                        </p>
                        <p className="text-sm font-medium">
                          {getMessageCount(session)} messages
                        </p>
                      </div>
                      <Link href={`/client-sessions/${session.id}`}>
                        <Button size="sm">View Conversation</Button>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="secondary">
                      {session.public_link.document_metadata.title}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
