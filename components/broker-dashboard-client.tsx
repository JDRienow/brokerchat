'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  UploadIcon,
  LoaderIcon,
  CheckCircleFillIcon,
  CrossIcon,
} from '@/components/icons';
import { toast } from '@/components/toast';
import { ProfilePopover } from '@/components/profile-popover';
import { uploadFileToStorage } from '@/lib/supabase-storage';
import { ConversationModal } from '@/components/conversation-modal';
import { PendingSubscriptionBanner } from '@/components/pending-subscription-banner';
import { getDaysRemainingInTrial, formatTrialDaysRemaining } from '@/lib/utils';
import { TrialCountdown } from '@/components/trial-countdown';
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
  document_id: string;
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
  totalLinks: number;
  activeLinks: number;
  totalViews: number;
  totalEmailCaptures: number;
  totalMessages: number;
}

interface EmailAnalytics {
  documents: Array<{
    document_id: string;
    document_title: string;
    link_title: string;
    emails: Array<{
      email: string;
      name: string | null;
      first_accessed: string;
      access_count: number;
    }>;
    total_unique_emails: number;
  }>;
  total_documents: number;
  total_unique_emails: number;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  chunks?: number;
  documentId?: string;
  title?: string;
  error?: string;
}

interface BrokerDashboardClientProps {
  session: {
    user: {
      id: string;
      email: string | null | undefined;
      type: 'broker';
      first_name: string | undefined;
      last_name: string | undefined;
      company_name: string | undefined;
      subscription_tier: string | undefined;
      subscription_status?: string;
      trial_ends_at?: string | null;
      logo_url: string | undefined;
      team_id?: string; // Added for team view indicator
    };
    expires: string;
  };
}

function getMaxDocumentsForTier(tier: string | undefined): number {
  switch (tier) {
    case 'team':
      return 200;
    case 'individual':
      return 25;
    case 'free_trial':
      return 5;
    case 'broker': // fallback for legacy
    case 'trial': // fallback for legacy
    default:
      return 5;
  }
}

export function BrokerDashboardClient({ session }: BrokerDashboardClientProps) {
  const searchParams = useSearchParams();
  const checkoutPlan = searchParams.get('checkout_plan');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [emailAnalytics, setEmailAnalytics] = useState<EmailAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [freshUserData, setFreshUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'documents' | 'links' | 'analytics' | 'upload'
  >('documents');

  // Document upload states
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Conversation modal states
  const [conversationModal, setConversationModal] = useState<{
    isOpen: boolean;
    email: string;
    documentId: string;
    documentTitle: string;
  }>({
    isOpen: false,
    email: '',
    documentId: '',
    documentTitle: '',
  });

  // Checkout states
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Use fresh data from database if available, otherwise fall back to session
  const subscriptionTier =
    freshUserData?.subscription_tier || session.user.subscription_tier;
  const subscriptionStatus =
    freshUserData?.subscription_status || session.user.subscription_status;
  const trialEndsAt =
    freshUserData?.trial_ends_at || session.user.trial_ends_at;
  const maxDocuments = getMaxDocumentsForTier(subscriptionTier);

  // Calculate trial countdown for free trial users
  const isFreeTrial = subscriptionTier === 'free_trial';
  const trialDaysRemaining = isFreeTrial
    ? getDaysRemainingInTrial(trialEndsAt)
    : 0;
  const trialCountdownText = isFreeTrial
    ? formatTrialDaysRemaining(trialDaysRemaining)
    : '';

  useEffect(() => {
    fetchDashboardData();
    // Track dashboard view analytics
    trackDashboardView();

    // Fetch fresh user data from database
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const userData = await response.json();
          setFreshUserData(userData.user);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();

    // Show success message if plan was updated
    if (searchParams.get('plan_updated') === 'true') {
      toast({
        type: 'success',
        description: 'Your plan has been updated successfully!',
      });
    }
  }, [searchParams]);

  // Separate useEffect for debug logging to avoid infinite loops
  useEffect(() => {
    if (freshUserData) {
      console.log('Dashboard data comparison:', {
        session: {
          subscription_tier: session?.user?.subscription_tier,
          subscription_status: session?.user?.subscription_status,
          trial_ends_at: session?.user?.trial_ends_at,
        },
        fresh: {
          subscription_tier: freshUserData?.subscription_tier,
          subscription_status: freshUserData?.subscription_status,
          trial_ends_at: freshUserData?.trial_ends_at,
        },
        calculated: {
          subscriptionTier,
          subscriptionStatus,
          trialEndsAt,
          isFreeTrial,
          trialDaysRemaining,
          trialCountdownText,
        },
      });
    }
  }, [
    freshUserData,
    session?.user?.subscription_tier,
    session?.user?.subscription_status,
    session?.user?.trial_ends_at,
    subscriptionTier,
    subscriptionStatus,
    trialEndsAt,
    isFreeTrial,
    trialDaysRemaining,
    trialCountdownText,
  ]);

  // Handle checkout if user was redirected here for purchase
  useEffect(() => {
    if (checkoutPlan && !isCheckoutLoading) {
      handleCheckout(checkoutPlan);
    }
  }, [checkoutPlan, isCheckoutLoading]);

  const handleCheckout = async (planName: string) => {
    if (!['individual', 'team'].includes(planName)) {
      return;
    }

    try {
      setIsCheckoutLoading(true);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planName,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        toast({
          type: 'error',
          description: 'Failed to create checkout session. Please try again.',
        });
        return;
      }

      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js').then((mod) =>
        mod.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''),
      );
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        type: 'error',
        description: 'Failed to create checkout session. Please try again.',
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const trackDashboardView = async () => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker_id: session.user.id,
          event_type: 'user_login', // Use allowed event type instead of 'dashboard_view'
          event_data: {
            action: 'dashboard_access',
            page: 'dashboard',
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      console.error('Failed to track dashboard view:', error);
      // Silently continue - analytics tracking is not critical
    }
  };

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
      const linksResponse = await fetch(`/api/public-links`);
      if (linksResponse.ok) {
        const linksData = await linksResponse.json();
        setPublicLinks(linksData.links || []);
      }

      // Fetch analytics with correct broker_id parameter
      const analyticsResponse = await fetch(`/api/analytics`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.summary);
      } else {
        console.error('Analytics API error:', analyticsResponse.status);
        // Set default analytics if API fails
        setAnalytics({
          totalLinks: publicLinks.length || 0,
          activeLinks: 0,
          totalViews: 0,
          totalEmailCaptures: 0,
          totalMessages: 0,
        });
      }

      // Fetch email analytics
      const emailAnalyticsResponse = await fetch(`/api/broker/email-analytics`);
      if (emailAnalyticsResponse.ok) {
        const emailData = await emailAnalyticsResponse.json();
        setEmailAnalytics(emailData);
      } else {
        console.error(
          'Email analytics API error:',
          emailAnalyticsResponse.status,
        );
        setEmailAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ type: 'error', description: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  // Document upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 50MB - Vercel Pro limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setResult({
          success: false,
          message: 'File size too large',
          error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size of 50MB. Please choose a smaller file.`,
        });
        return;
      }

      console.log('File selected:', {
        name: file.name,
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2),
      });

      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Step 1: Upload file to Supabase Storage
      console.log('Uploading file to Supabase Storage...');
      const uploadData = await uploadFileToStorage(
        selectedFile,
        session.user.id,
      );

      console.log('File uploaded to storage successfully:', uploadData);

      // Step 2: Send file URL to backend for processing
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: uploadData.url,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
          fileType: uploadData.fileType,
          storagePath: uploadData.path,
        }),
      });

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 413) {
          throw new Error(
            'File too large. Please choose a smaller PDF file (max 50MB).',
          );
        } else if (response.status === 504) {
          throw new Error(
            'Processing timeout. Please try again with a smaller file.',
          );
        } else if (response.status === 403) {
          const data = await response.json();
          throw new Error(
            data.error || 'You have reached your document limit.',
          );
        } else {
          throw new Error(
            `Processing failed with status ${response.status}. Please try again.`,
          );
        }
      }

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Track document upload analytics
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              broker_id: session.user.id,
              event_type: 'document_upload',
              event_data: {
                document_id: data.documentId,
                document_title: data.title,
                chunk_count: data.chunks,
                file_size: selectedFile?.size,
                file_type: selectedFile?.type,
                storage_url: uploadData.url,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (analyticsError) {
          console.error('Failed to track document upload:', analyticsError);
        }

        // Refresh dashboard data to show new document
        await fetchDashboardData();
        // Stay on upload tab for better UX
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to upload and process file',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
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
          title: `Chat with ${title}`,
          description: `Interactive document chat for ${title}`,
          requires_email: true,
        }),
      });

      if (response.ok) {
        const linkData = await response.json();

        // Track public link creation analytics
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              broker_id: session.user.id,
              public_link_id: linkData.id,
              event_type: 'public_link_create',
              event_data: {
                document_id: documentId,
                document_title: title,
                requires_email: true,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (analyticsError) {
          console.error(
            'Failed to track public link creation:',
            analyticsError,
          );
        }

        toast({
          type: 'success',
          description: 'Public link created successfully!',
        });
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          // Handle duplicate link error
          toast({
            type: 'error',
            description:
              'A public link already exists for this document. Only one link per document is allowed.',
          });
        } else {
          throw new Error(errorData.error || 'Failed to create public link');
        }
      }
    } catch (error) {
      console.error('Error creating public link:', error);
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
        // Track public link toggle analytics
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              broker_id: session.user.id,
              public_link_id: linkId,
              event_type: isActive
                ? 'public_link_delete'
                : 'public_link_create', // Use allowed event types
              event_data: {
                action: 'status_toggle',
                old_status: isActive,
                new_status: !isActive,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (analyticsError) {
          console.error('Failed to track public link toggle:', analyticsError);
        }

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

  // Helper function to check if a document has a public link
  const getPublicLinkForDocument = (documentId: string) => {
    return publicLinks.find((link) => link.document_id === documentId);
  };

  const deletePublicLink = async (linkId: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the public link for "${title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/public-links?id=${linkId}&broker_id=${session.user.id}`,
        {
          method: 'DELETE',
        },
      );

      if (response.ok) {
        // Track public link deletion analytics
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              broker_id: session.user.id,
              public_link_id: linkId,
              event_type: 'public_link_delete',
              event_data: {
                link_title: title,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (analyticsError) {
          console.error(
            'Failed to track public link deletion:',
            analyticsError,
          );
        }

        toast({
          type: 'success',
          description: 'Public link deleted successfully!',
        });
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Failed to delete public link');
      }
    } catch (error) {
      console.error('Error deleting public link:', error);
      toast({ type: 'error', description: 'Failed to delete public link' });
    }
  };

  const deleteDocument = async (documentId: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This will permanently delete the document and all its associated data, including public links and chat history. This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Track document deletion analytics
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              broker_id: session.user.id,
              event_type: 'document_delete',
              event_data: {
                document_id: documentId,
                document_title: title,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (analyticsError) {
          console.error('Failed to track document deletion:', analyticsError);
        }

        toast({
          type: 'success',
          description: 'Document deleted successfully!',
        });
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Failed to delete document',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
      {/* Pending Subscription Banner */}
      {subscriptionStatus === 'pending' && (
        <PendingSubscriptionBanner
          plan={subscriptionTier || 'individual'}
          onCompletePayment={() =>
            handleCheckout(subscriptionTier || 'individual')
          }
        />
      )}

      {/* Trial Countdown Banner */}
      {(() => {
        console.log('Trial countdown banner condition check:', {
          isFreeTrial,
          trialCountdownText,
          trialEndsAt,
          shouldShow: isFreeTrial && trialCountdownText,
        });
        return isFreeTrial && trialCountdownText ? (
          <div className="mb-6">
            <TrialCountdown
              trialEndsAt={trialEndsAt}
              variant="banner"
              showUpgradeButton={true}
              onUpgradeClick={() => window.open('/pricing', '_blank')}
            />
          </div>
        ) : null;
      })()}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Image
            src="/images/om2chat (400 x 100 px).svg"
            alt="OM2Chat"
            width={400}
            height={100}
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user.first_name} {session?.user.last_name}
              {session?.user.team_id && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Team View
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setActiveTab('upload')}
            variant={activeTab === 'upload' ? 'default' : 'outline'}
          >
            <PlusIcon size={16} />
            <span className="ml-2">Upload Document</span>
          </Button>
          <ProfilePopover user={session?.user} />
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Public Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLinks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Chat Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'documents'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Documents
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('links')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'links'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Public Links
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upload Document
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('analytics');
            // Track analytics view using allowed event type
            try {
              fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  broker_id: session.user.id,
                  event_type: 'user_login', // Use allowed event type instead of 'analytics_view'
                  event_data: {
                    action: 'analytics_tab_view',
                    timestamp: new Date().toISOString(),
                  },
                }),
              });
            } catch (error) {
              console.error('Failed to track analytics view:', error);
            }
          }}
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
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon size={20} />
                Upload Document
              </CardTitle>
              <CardDescription>
                Upload a PDF document to create a public chat link
              </CardDescription>
              <div className="text-xs text-muted-foreground mt-2">
                Usage: {documents.length} of {maxDocuments} allowed
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select PDF Document</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 50MB
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileIcon size={16} />
                  <span className="text-sm font-medium">
                    {selectedFile.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}

              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircleFillIcon size={16} />
                    ) : (
                      <CrossIcon size={16} />
                    )}
                    <span className="font-medium">{result.message}</span>
                  </div>
                  {result.error && (
                    <p className="mt-2 text-sm">{result.error}</p>
                  )}
                  {result.success && result.chunks && (
                    <p className="mt-2 text-sm">
                      Document processed successfully! {result.chunks} chunks
                      created.
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin">
                      <LoaderIcon size={16} />
                    </div>
                    <span className="ml-2">Processing...</span>
                  </>
                ) : (
                  'Upload & Process Document'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Documents</h2>
          </div>
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileIcon size={48} />
                <h3 className="text-lg font-medium mb-2 mt-4">
                  No documents yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start by uploading your first document
                </p>
                <Button onClick={() => setActiveTab('upload')}>
                  Upload Document
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
                      {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        const existingLink = getPublicLinkForDocument(doc.id);
                        return (
                          <>
                            <div className="flex gap-2 justify-between">
                              <div className="flex gap-2">
                                {existingLink ? (
                                  <Button
                                    size="sm"
                                    className="border-black text-black hover:bg-black hover:text-white bg-black text-white"
                                    onClick={() =>
                                      window.open(
                                        `/public/${existingLink.token}`,
                                        '_blank',
                                      )
                                    }
                                  >
                                    <ShareIcon size={16} />
                                    <span className="ml-2">View Link</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      createPublicLink(doc.id, doc.title)
                                    }
                                  >
                                    <ShareIcon size={16} />
                                    <span className="ml-2">Create Link</span>
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/document/${doc.id}`}>
                                    <MessageIcon size={16} />
                                    <span className="ml-2">Chat</span>
                                  </Link>
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() =>
                                  deleteDocument(doc.id, doc.title)
                                }
                              >
                                <CrossIcon size={16} />
                                <span className="ml-2">Delete</span>
                              </Button>
                            </div>
                          </>
                        );
                      })()}
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
                <ShareIcon size={48} />
                <h3 className="text-lg font-medium mb-2 mt-4">
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
                        <EyeIcon size={16} />
                        <span>{link.view_count || 0} views</span>
                        <UserIcon />
                        <span>{link.unique_visitors || 0} visitors</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs font-mono">
                        <span className="flex-1 truncate">
                          {window.location.origin}/public/{link.token}
                        </span>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/public/${link.token}`,
                            )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <CopyIcon size={12} />
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() =>
                            window.open(`/public/${link.token}`, '_blank')
                          }
                          size="sm"
                          variant="outline"
                        >
                          <GlobeIcon size={16} />
                          <span className="ml-2">Preview</span>
                        </Button>
                        <Button
                          onClick={() =>
                            toggleLinkStatus(link.id, link.is_active)
                          }
                          size="sm"
                          variant={link.is_active ? 'outline' : 'default'}
                        >
                          {link.is_active ? (
                            <>
                              <LockIcon size={16} />
                              <span className="ml-2">Deactivate</span>
                            </>
                          ) : (
                            <>
                              <GlobeIcon size={16} />
                              <span className="ml-2">Activate</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => deletePublicLink(link.id, link.title)}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <CrossIcon size={16} />
                          <span className="ml-2">Delete</span>
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

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Analytics Overview</h2>
          </div>

          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{documents.length}</div>
                  <p className="text-muted-foreground text-sm">
                    Documents uploaded and processed
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Usage: {documents.length} of {maxDocuments} allowed
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Public Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {publicLinks.filter((link) => link.is_active).length}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Out of {publicLinks.length} total links
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Unique Emails Captured</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {emailAnalytics?.total_unique_emails || 0}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Client email registrations
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-muted-foreground mb-4">
                  Analytics data will appear here once you have activity
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Analytics Section */}
          {emailAnalytics && emailAnalytics.documents.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Email Access by Document
                </h3>
                <Badge variant="outline">
                  {emailAnalytics.total_unique_emails} total unique emails
                </Badge>
              </div>

              <div className="space-y-4">
                {emailAnalytics.documents.map((doc) => (
                  <Card key={doc.document_id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {doc.document_title}
                          </CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {doc.total_unique_emails} emails
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {doc.emails.length > 0 ? (
                        <div className="space-y-2">
                          {doc.emails.map((emailData, index) => (
                            <div
                              key={emailData.email}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-muted-foreground">
                                  <UserIcon />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {emailData.email}
                                  </div>
                                  {emailData.name && (
                                    <div className="text-sm text-muted-foreground">
                                      {emailData.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-muted-foreground">
                                  First accessed:{' '}
                                  {new Date(
                                    emailData.first_accessed,
                                  ).toLocaleDateString()}
                                </div>
                                <Button
                                  onClick={() =>
                                    setConversationModal({
                                      isOpen: true,
                                      email: emailData.email,
                                      documentId: doc.document_id,
                                      documentTitle: doc.document_title,
                                    })
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                >
                                  <MessageIcon size={14} />
                                  <span className="ml-1">
                                    View Conversation
                                  </span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No email captures yet for this document
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversation Modal */}
      <ConversationModal
        isOpen={conversationModal.isOpen}
        onClose={() =>
          setConversationModal({
            isOpen: false,
            email: '',
            documentId: '',
            documentTitle: '',
          })
        }
        email={conversationModal.email}
        documentId={conversationModal.documentId}
        documentTitle={conversationModal.documentTitle}
      />
    </div>
  );
}
