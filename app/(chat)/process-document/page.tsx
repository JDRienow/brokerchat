'use client';

import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RefreshCwIcon,
  UploadIcon,
  FileIcon,
  CheckIcon,
  XIcon,
  LinkIcon,
  CopyIcon,
} from 'lucide-react';
import { toast } from '@/components/toast';

interface ProcessingResult {
  success: boolean;
  message: string;
  chunks?: number;
  documentId?: string;
  title?: string;
  error?: string;
}

interface Document {
  id: string;
  title: string;
  created_at: string;
  url: string;
  chunks?: number;
}

export default function ProcessDocumentPage() {
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [creatingPublicLink, setCreatingPublicLink] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processExistingDocument = async (documentId: string) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('existingDocumentId', documentId);

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to process document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadExistingDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const createPublicLink = async (documentId: string, title: string) => {
    if (!session || session.user.type !== 'broker') {
      toast({
        type: 'error',
        description: 'Only brokers can create public links',
      });
      return;
    }

    setCreatingPublicLink(true);
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

      if (!response.ok) {
        throw new Error('Failed to create public link');
      }

      const data = await response.json();
      const linkUrl = `${window.location.origin}/public/${data.token}`;
      setPublicLink(linkUrl);
      toast({
        type: 'success',
        description: 'Public link created successfully!',
      });
    } catch (error) {
      console.error('Error creating public link:', error);
      toast({ type: 'error', description: 'Failed to create public link' });
    } finally {
      setCreatingPublicLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ type: 'success', description: 'Link copied to clipboard!' });
  };

  const isBroker = session?.user?.type === 'broker';

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold">Process Documents</h1>
            <p className="text-muted-foreground">
              Upload PDF files to extract text and create searchable document
              chunks for chat
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Upload New Document */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5" />
                  Upload New Document
                </CardTitle>
                <CardDescription>
                  Select a PDF file to process and add to your document
                  collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf-file">Select PDF File</Label>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <FileIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Process Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileIcon className="w-5 h-5" />
                  Existing Documents
                </CardTitle>
                <CardDescription>
                  View and reprocess documents that are already in your
                  collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={loadExistingDocuments}
                  disabled={loadingDocuments}
                  variant="outline"
                  className="w-full"
                >
                  {loadingDocuments ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCwIcon className="w-4 h-4 mr-2" />
                      Load Documents
                    </>
                  )}
                </Button>

                {documents.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {doc.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                            {doc.chunks && ` • ${doc.chunks} chunks`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() =>
                                  window.open(`/chat/${doc.id}`, '_blank')
                                }
                                variant="default"
                                size="sm"
                              >
                                Chat
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Chat with Document</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => processExistingDocument(doc.id)}
                                disabled={isProcessing}
                                variant="outline"
                                size="sm"
                              >
                                <RefreshCwIcon className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reprocess Document</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {result && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <XIcon className="w-5 h-5 text-red-600" />
                  )}
                  Processing Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`p-4 rounded-md ${
                    result.success
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <p className="font-medium">{result.message}</p>
                  {result.success && result.documentId && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <strong>Document ID:</strong> {result.documentId}
                      </p>
                      {result.title && (
                        <p className="text-sm">
                          <strong>Title:</strong> {result.title}
                        </p>
                      )}
                      {result.chunks && (
                        <p className="text-sm">
                          <strong>Chunks Created:</strong> {result.chunks}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() =>
                            window.open(`/chat/${result.documentId}`, '_blank')
                          }
                          size="sm"
                          variant="outline"
                        >
                          Chat with Document
                        </Button>
                        {isBroker && result.documentId && result.title && (
                          <Button
                            onClick={() =>
                              createPublicLink(
                                result.documentId as string,
                                result.title as string,
                              )
                            }
                            disabled={creatingPublicLink}
                            size="sm"
                            variant="default"
                          >
                            {creatingPublicLink ? (
                              <>
                                <RefreshCwIcon className="w-3 h-3 mr-1 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3 h-3 mr-1" />
                                Create Public Link
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {result.error && (
                    <p className="text-sm mt-2">
                      <strong>Error:</strong> {result.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Public Link Display */}
          {publicLink && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  Public Link Created
                </CardTitle>
                <CardDescription>
                  Share this link with your clients to let them chat with the
                  document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <code className="flex-1 text-sm font-mono text-blue-600">
                      {publicLink}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(publicLink)}
                      size="sm"
                      variant="outline"
                    >
                      <CopyIcon className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(publicLink, '_blank')}
                      size="sm"
                      variant="outline"
                    >
                      Preview Link
                    </Button>
                    <Button
                      onClick={() => window.open('/dashboard', '_blank')}
                      size="sm"
                      variant="default"
                    >
                      Manage Links
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
