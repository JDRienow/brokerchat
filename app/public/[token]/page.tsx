'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import { MessageIcon, FileIcon, UserIcon, GlobeIcon } from '@/components/icons';
import { Chat } from '@/components/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface PublicLinkData {
  id: string;
  title: string;
  description: string;
  document_id: string;
  document_title: string;
  document_url: string;
  document_created_at: string;
  broker_name: string;
  broker_company: string;
  requires_email: boolean;
  custom_branding?: {
    logo_url?: string;
    primary_color?: string;
    company_name?: string;
  };
}

interface ClientSession {
  token: string;
  client_email?: string;
  client_name?: string;
  chat_history?: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }>;
}

export default function PublicLinkPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [linkData, setLinkData] = useState<PublicLinkData | null>(null);
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchPublicLink();
  }, [resolvedParams.token]);

  const fetchPublicLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-links/${resolvedParams.token}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('This link is no longer available or has been deactivated.');
        } else {
          setError('Failed to load the document.');
        }
        return;
      }

      const data = await response.json();
      setLinkData(data.link);
      setSession(data.session);

      // Show email form if required and no session exists
      if (data.link.requires_email && !data.session) {
        setShowEmailForm(true);
      }
    } catch (error) {
      console.error('Error fetching public link:', error);
      setError('Failed to load the document.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientEmail.trim()) {
      toast({ type: 'error', description: 'Please enter your email address' });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/public-links/${resolvedParams.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_email: clientEmail.trim(),
          client_name: clientName.trim(),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to register email');
      }

      const data = await response.json();
      setSession(data.session);
      setShowEmailForm(false);
      toast({
        type: 'success',
        description: 'Access granted! You can now chat with the document.',
      });
    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        type: 'error',
        description: 'Failed to register email. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // Show a special message for deactivated links, no navigation options
    if (error.toLowerCase().includes('deactivated')) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">This Document Chat is Deactivated</CardTitle>
            </CardHeader>
          </Card>
        </div>
      );
    }
    // For all other errors, show the default error UI
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Document Unavailable</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkData) {
    return null;
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {linkData.custom_branding?.logo_url ? (
                  <img
                    src={linkData.custom_branding.logo_url}
                    alt="Company Logo"
                    className="h-8 w-8 rounded"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                    <GlobeIcon size={16} />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-semibold">{linkData.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {linkData.broker_company || linkData.broker_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileIcon size={16} />
                <span>{linkData.document_title}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Description */}
            {linkData.description && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">{linkData.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Email Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon />
                  Get Access to Chat
                </CardTitle>
                <CardDescription>
                  Please provide your contact information to access the document
                  chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client_name">Name (Optional)</Label>
                      <Input
                        id="client_name"
                        type="text"
                        placeholder="Your full name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_email">Email Address *</Label>
                      <Input
                        id="client_email"
                        type="email"
                        placeholder="your@email.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? 'Processing...' : 'Get Access'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

    // Chat Interface - Full screen like main app
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Sticky, clean header for document title */}
      <div className="sticky top-0 z-20 w-full py-4 px-4 border-b bg-white shadow-sm flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold text-center">{linkData.document_title}</h1>
        {linkData.broker_company || linkData.broker_name ? (
          <p className="text-xs text-muted-foreground text-center mt-1">
            {linkData.broker_company || linkData.broker_name}
          </p>
        ) : null}
      </div>
      <DataStreamProvider>
        <SidebarProvider defaultOpen={false}>
          <SidebarInset className="flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col pt-24">
              <Chat
                id={linkData.document_id}
                initialMessages={session?.chat_history ? session.chat_history.map(msg => ({
                  id: msg.id,
                  role: msg.role as 'user' | 'assistant',
                  parts: [{ type: 'text', text: msg.content }],
                  createdAt: new Date(msg.created_at),
                })) : []}
                initialVisibilityType="private"
                isReadonly={false}
                session={session as any}
                autoResume={false}
                isPublic={true}
                documentMetadata={{
                  id: linkData.document_id,
                  title: linkData.document_title,
                  url: linkData.document_url,
                  created_at: linkData.document_created_at,
                }}
                hideGreetingTitle
                hideHeader
              />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </div>
  );
}
