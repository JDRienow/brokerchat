'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>

          <div className="text-sm text-gray-600 mb-8">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 mb-4">
              OM2Chat ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              AI-powered document intelligence platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              2.1 Personal Information
            </h3>
            <p className="text-gray-700 mb-4">
              We collect personal information you provide directly to us:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Name and email address when you create an account</li>
              <li>Company name and contact information</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Profile information and preferences</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              2.2 Document Data
            </h3>
            <p className="text-gray-700 mb-4">
              When you use our service, we process:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Documents you upload for analysis</li>
              <li>Chat conversations with your documents</li>
              <li>Analytics and usage data</li>
              <li>Public link interactions and visitor data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              2.3 Technical Information
            </h3>
            <p className="text-gray-700 mb-4">We automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage patterns and analytics</li>
              <li>Error logs and performance data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              We use the collected information for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Providing and maintaining our services</li>
              <li>Processing payments and managing subscriptions</li>
              <li>Analyzing documents and generating AI responses</li>
              <li>Improving our platform and user experience</li>
              <li>Sending important service updates and notifications</li>
              <li>Providing customer support</li>
              <li>Ensuring security and preventing fraud</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Information Sharing
            </h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information. We may
              share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Service Providers:</strong> With trusted third-party
                services (Stripe, Resend, etc.)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger
                or acquisition
              </li>
              <li>
                <strong>Consent:</strong> With your explicit consent
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect your
              information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and updates</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Data Retention
            </h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as necessary to provide our
              services and comply with legal obligations. You can request
              deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent where applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Cookies and Tracking
            </h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to enhance your
              experience, analyze usage, and provide personalized content. You
              can control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Third-Party Services
            </h2>
            <p className="text-gray-700 mb-4">
              Our service integrates with third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Stripe:</strong> Payment processing
              </li>
              <li>
                <strong>Resend:</strong> Email delivery
              </li>
              <li>
                <strong>OpenAI:</strong> AI model services
              </li>
              <li>
                <strong>Supabase:</strong> Database and authentication
              </li>
            </ul>
            <p className="text-gray-700 mb-4">
              These services have their own privacy policies, and we encourage
              you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Children's Privacy
            </h2>
            <p className="text-gray-700 mb-4">
              Our service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Changes to This Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              our website and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us:
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
