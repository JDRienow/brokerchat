'use client';

import { useState, useEffect } from 'react';
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

interface PublicLinkData {
  id: string;
  title: string;
  description: string;
  document_id: string;
  document_title: string;
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
}

export default function PublicLinkPage({
  params,
}: { params: { token: string } }) {
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
  }, [params.token]);

  const fetchPublicLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-links/${params.token}`, {
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
      const response = await fetch(`/api/public-links/${params.token}`, {
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
          {showEmailForm && (
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
          )}

          {/* Chat Interface */}
          {(!linkData.requires_email || session) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageIcon size={20} />
                  Chat with Document
                </CardTitle>
                <CardDescription>
                  Ask questions about the document and get instant answers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  <Chat
                    id={linkData.document_id}
                    initialMessages={[]}
                    initialChatModel="gpt-4o-mini"
                    initialVisibilityType="private"
                    isReadonly={false}
                    session={session as any}
                    autoResume={false}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Powered by{' '}
              <span className="font-medium">
                {linkData.custom_branding?.company_name ||
                  linkData.broker_company ||
                  'Real Estate Platform'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Secure document sharing and chat
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
