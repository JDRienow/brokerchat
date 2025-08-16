'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfServicePage() {
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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Terms of Service
          </h1>

          <div className="text-sm text-gray-600 mb-8">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-4">
              By accessing and using OM2Chat ("the Service"), you accept and
              agree to be bound by the terms and provision of this agreement. If
              you do not agree to abide by the above, please do not use this
              service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 mb-4">
              OM2Chat is an AI-powered document intelligence platform designed
              for commercial real estate professionals. The Service allows users
              to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Upload and analyze commercial real estate documents</li>
              <li>Chat with documents using AI technology</li>
              <li>Create and share branded client links</li>
              <li>Track analytics and engagement metrics</li>
              <li>Generate insights and reports from documents</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-700 mb-4">
              To access certain features of the Service, you must create an
              account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                Maintaining the confidentiality of your account credentials
              </li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Subscription and Payment
            </h2>
            <p className="text-gray-700 mb-4">
              The Service offers both free trial and paid subscription plans:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Free Trial:</strong> 14-day free trial with limited
                features
              </li>
              <li>
                <strong>Individual Plan:</strong> $25/month with up to 25
                documents
              </li>
              <li>
                <strong>Team Plan:</strong> $75/month with up to 200 documents
              </li>
            </ul>
            <p className="text-gray-700 mb-4">
              All payments are processed through Stripe. Subscriptions
              automatically renew unless cancelled before the renewal date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Acceptable Use
            </h2>
            <p className="text-gray-700 mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Upload illegal, harmful, or inappropriate content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use the Service for spam or unsolicited communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Data and Privacy
            </h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Please review our{' '}
              <Link
                href="/legal/privacy"
                className="text-[#38b6ff] hover:underline"
              >
                Privacy Policy
              </Link>{' '}
              to understand how we collect, use, and protect your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality
              are owned by OM2Chat and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property
              laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              In no event shall OM2Chat, nor its directors, employees, partners,
              agents, suppliers, or affiliates, be liable for any indirect,
              incidental, special, consequential, or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Termination
            </h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and bar access to the
              Service immediately, without prior notice or liability, under our
              sole discretion, for any reason whatsoever, including without
              limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify or replace these Terms at any time.
              If a revision is material, we will provide at least 30 days notice
              prior to any new terms taking effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> support@om2chat.com
                <br />
                <strong>Address:</strong> 2501 Chatham Road #8122, Springfield,
                TN US
              </p>
            </div>
          </section>
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
