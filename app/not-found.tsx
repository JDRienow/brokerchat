'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
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
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. It might have
              been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full bg-[#38b6ff] hover:bg-[#1e40af] text-white">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Need help? Try these links:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/login" className="text-[#38b6ff] hover:underline">
                Sign In
              </Link>
              <Link href="/register" className="text-[#38b6ff] hover:underline">
                Get Started
              </Link>
              <a
                href="mailto:support@om2chat.com"
                className="text-[#38b6ff] hover:underline"
              >
                Contact Support
              </a>
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
