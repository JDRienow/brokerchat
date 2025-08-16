'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useEffect } from 'react';
import { errorHandler } from '@/lib/error-handler';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    errorHandler.logManualError(error, {
      digest: error.digest,
      page: 'global-error',
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Image
                src="/images/om2chat-logo.svg"
                alt="OM2Chat"
                width={160}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <span className="text-gray-600 hover:text-gray-900">Sign In</span>
            </Link>
            <Link href="/register">
              <span className="bg-[#38b6ff] hover:bg-[#1e40af] text-white px-4 py-2 rounded">
                Get Started
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-8">
              We're sorry, but something unexpected happened. Our team has been
              notified and is working to fix the issue.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={reset}
              className="w-full bg-[#38b6ff] hover:bg-[#1e40af] text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              If the problem persists, please contact our support team:
            </p>
            <div className="flex flex-col space-y-2 text-sm">
              <a
                href="mailto:support@om2chat.com"
                className="text-[#38b6ff] hover:underline"
              >
                support@om2chat.com
              </a>
              {error.digest && (
                <p className="text-xs text-gray-400">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-50 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <Link
              href="/legal/terms"
              className="text-gray-600 hover:text-gray-900"
            >
              Terms of Service
            </Link>
            <Link
              href="/legal/privacy"
              className="text-gray-600 hover:text-gray-900"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/refund"
              className="text-gray-600 hover:text-gray-900"
            >
              Refund Policy
            </Link>
          </div>
          <p className="text-gray-500">
            &copy; 2024 OM2Chat. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
