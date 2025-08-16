/**
 * PUBLIC CHAT PAGE - NO AUTHENTICATION REQUIRED
 * 
 * This page is designed to be completely isolated from authentication requirements.
 * It should NEVER redirect to /login or require any form of authentication.
 * 
 * Key features:
 * - No session checks or redirects
 * - Uses simple fetch requests without credentials
 * - Completely standalone from the main app authentication flow
 * - Accessible to anyone with a valid public link token
 */

'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
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
  broker?: {
    logo_url?: string;
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

  useEffect(() => {
    fetchPublicLink();
  }, [resolvedParams.token]);

  const fetchPublicLink = async () => {
    try {
      setLoading(true);
      
      // Use a simple fetch without credentials to ensure no session interference
      const response = await fetch(`/api/public-links/${resolvedParams.token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Always show email form if required, regardless of existing session
      // This ensures users must provide email on every page refresh
      if (data.link.requires_email) {
        setShowEmailForm(true);
        setSession(null); // Clear any existing session
      } else {
        // Only if email is not required, use the session from API
        setSession(data.session);
        setShowEmailForm(false);
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
      // Use a simple fetch without credentials to ensure no session interference
      const response = await fetch(`/api/public-links/${resolvedParams.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_email: clientEmail.trim(),
          client_name: clientName.trim(),
        }),
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
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Error</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
                {linkData.broker?.logo_url ? (
                  <Image
                    src={linkData.broker.logo_url}
                    alt="Brokerage Logo"
                    width={160}
                    height={40}
                    className="h-8 w-auto rounded"
                  />
                ) : (
                  <Image
                    src="/images/om2chat-logo (160 x 40 px).svg"
                    alt="OM2Chat"
                    width={160}
                    height={40}
                    className="h-8 w-auto"
                  />
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
    <div className="flex flex-col h-screen bg-background relative">
      {/* Fixed header for document title */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full px-4 border-b bg-white shadow-sm">
        <div className="flex flex-col items-center py-2">
          {linkData.broker && linkData.broker.logo_url ? (
            <Image
              src={linkData.broker.logo_url}
              alt="Brokerage Logo"
              width={160}
              height={40}
              className="h-8 w-auto mb-2 rounded"
            />
          ) : null}
          <h1 className="text-xl font-bold text-center">{linkData.document_title}</h1>
          {linkData.broker_company || linkData.broker_name ? (
            <p className="text-xs text-muted-foreground text-center mt-1">
              {linkData.broker_company || linkData.broker_name}
            </p>
          ) : null}
        </div>
      </div>
      <DataStreamProvider>
        <SidebarProvider defaultOpen={false}>
          <SidebarInset className="flex flex-col h-full">
            <div className="flex-1 min-h-0 flex flex-col relative">
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
                headerOffsetPx={70}
              />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </div>
  );
}
