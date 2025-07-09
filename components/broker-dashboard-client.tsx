'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon,
  FileIcon,
  ShareIcon,
  MessageIcon,
  EyeIcon,
  UserIcon,
  CopyIcon,
  LockIcon,
  GlobeIcon,
} from '@/components/icons';
import { toast } from '@/components/toast';
import type { Session } from 'next-auth';

interface Document {
  id: string;
  title: string;
  url: string;
  created_at: string;
  chunk_count: number;
}

interface PublicLink {
  id: string;
  token: string;
  title: string;
  description: string;
  is_active: boolean;
  requires_email: boolean;
  created_at: string;
  view_count: number;
  unique_visitors: number;
  document_title: string;
}

interface Analytics {
  total_documents: number;
  total_public_links: number;
  total_views: number;
  total_email_captures: number;
  total_chat_messages: number;
  conversion_rate: number;
}

interface BrokerDashboardClientProps {
  session: Session;
}

export function BrokerDashboardClient({ session }: BrokerDashboardClientProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'documents' | 'links' | 'analytics'
  >('documents');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch documents
      const docsResponse = await fetch('/api/broker/documents');
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.documents || []);
      }

      // Fetch public links
      const linksResponse = await fetch(
        `/api/public-links?broker_id=${session.user.id}`,
      );
      if (linksResponse.ok) {
        const linksData = await linksResponse.json();
        setPublicLinks(linksData.links || []);
      }

      // Fetch analytics
      const analyticsResponse = await fetch('/api/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ type: 'error', description: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const createPublicLink = async (documentId: string, title: string) => {
    try {
      const response = await fetch('/api/public-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          broker_id: session.user.id,
          title: title,
          description: `Public chat link for ${title}`,
          requires_email: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          type: 'success',
          description: 'Public link created successfully!',
        });
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to create public link');
      }
    } catch (error) {
      toast({ type: 'error', description: 'Failed to create public link' });
    }
  };

  const toggleLinkStatus = async (linkId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/public-links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: linkId,
          is_active: !isActive,
        }),
      });

      if (response.ok) {
        toast({
          type: 'success',
          description: `Link ${!isActive ? 'activated' : 'deactivated'} successfully!`,
        });
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to update link status');
      }
    } catch (error) {
      toast({ type: 'error', description: 'Failed to update link status' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ type: 'success', description: 'Link copied to clipboard!' });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user.first_name} {session?.user.last_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/process-document">
              <PlusIcon size={16} className="mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.total_documents}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Public Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.total_public_links}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_views}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.conversion_rate}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'documents'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'links'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Public Links ({publicLinks.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Documents</h2>
          </div>
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by uploading your first document
                </p>
                <Button asChild>
                  <Link href="/process-document">Upload Document</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <CardDescription>
                      {doc.chunk_count} chunks •{' '}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createPublicLink(doc.id, doc.title)}
                      >
                        <ShareIcon className="h-4 w-4 mr-2" />
                        Create Link
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/chat/${doc.id}`}>
                          <MessageIcon className="h-4 w-4 mr-2" />
                          Chat
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'links' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Public Links</h2>
          </div>
          {publicLinks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShareIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No public links yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create public links to share with your clients
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {publicLinks.map((link) => (
                <Card key={link.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        <CardDescription>
                          {link.document_title} •{' '}
                          {new Date(link.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={link.is_active ? 'default' : 'secondary'}
                        >
                          {link.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {link.requires_email && (
                          <Badge variant="outline">Email Required</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <EyeIcon className="h-4 w-4" />
                        <span>{link.view_count} views</span>
                        <UserIcon className="h-4 w-4 ml-4" />
                        <span>{link.unique_visitors} unique visitors</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <code className="flex-1 text-sm">
                          {`${window.location.origin}/public/${link.token}`}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/public/${link.token}`,
                            )
                          }
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleLinkStatus(link.id, link.is_active)
                          }
                        >
                          {link.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/public/${link.token}`} target="_blank">
                            <GlobeIcon className="h-4 w-4 mr-2" />
                            Visit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Messages</span>
                  <span className="font-medium">
                    {analytics.total_chat_messages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Captures</span>
                  <span className="font-medium">
                    {analytics.total_email_captures}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page Views</span>
                  <span className="font-medium">{analytics.total_views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="font-medium">
                    {analytics.conversion_rate}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Links</span>
                  <span className="font-medium">
                    {publicLinks.filter((link) => link.is_active).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Links</span>
                  <span className="font-medium">
                    {analytics.total_public_links}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents</span>
                  <span className="font-medium">
                    {analytics.total_documents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Avg. Views per Link
                  </span>
                  <span className="font-medium">
                    {analytics.total_public_links > 0
                      ? Math.round(
                          analytics.total_views / analytics.total_public_links,
                        )
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
