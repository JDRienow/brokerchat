'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function RefundPolicyPage() {
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
            Refund Policy
          </h1>

          <div className="text-sm text-gray-600 mb-8">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Overview
            </h2>
            <p className="text-gray-700 mb-4">
              At OM2Chat, we want you to be completely satisfied with our
              AI-powered document intelligence platform. This refund policy
              outlines the terms and conditions for refunds and cancellations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Free Trial
            </h2>
            <p className="text-gray-700 mb-4">
              We offer a 14-day free trial for all new users. During the trial
              period:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>No payment is required to start your trial</li>
              <li>
                You can cancel at any time during the trial without charge
              </li>
              <li>
                Your account will be automatically upgraded to a paid plan after
                the trial ends
              </li>
              <li>You will be notified via email before your trial expires</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Subscription Cancellation
            </h2>
            <p className="text-gray-700 mb-4">
              You can cancel your subscription at any time:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Through your account dashboard</li>
              <li>By contacting our support team</li>
              <li>By emailing support@om2chat.com</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> Cancellation will take effect at the
              end of your current billing period. You will continue to have
              access to the service until the end of the period you've already
              paid for.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Refund Eligibility
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.1 30-Day Money-Back Guarantee
            </h3>
            <p className="text-gray-700 mb-4">
              We offer a 30-day money-back guarantee for all paid subscriptions.
              If you're not satisfied with our service within the first 30 days
              of your paid subscription, we'll provide a full refund.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.2 Refund Conditions
            </h3>
            <p className="text-gray-700 mb-4">
              Refunds may be provided in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Service outages lasting more than 24 hours</li>
              <li>Technical issues preventing normal use of the service</li>
              <li>Billing errors or duplicate charges</li>
              <li>Unsatisfactory service quality within the first 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.3 Non-Refundable Situations
            </h3>
            <p className="text-gray-700 mb-4">
              Refunds will not be provided for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Usage beyond the 30-day guarantee period</li>
              <li>Violation of our Terms of Service</li>
              <li>Change of mind after extensive use of the service</li>
              <li>Failure to cancel before automatic renewal</li>
              <li>Requests made more than 30 days after payment</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. How to Request a Refund
            </h2>
            <p className="text-gray-700 mb-4">To request a refund:</p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4">
              <li>Contact our support team at support@om2chat.com</li>
              <li>Include your account email address</li>
              <li>Provide the reason for your refund request</li>
              <li>Include any relevant details or screenshots</li>
            </ol>
            <p className="text-gray-700 mb-4">
              We will review your request and respond within 3-5 business days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Refund Processing
            </h2>
            <p className="text-gray-700 mb-4">
              Once approved, refunds will be processed as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Processing Time:</strong> 5-10 business days
              </li>
              <li>
                <strong>Method:</strong> Refunded to the original payment method
              </li>
              <li>
                <strong>Notification:</strong> You'll receive an email
                confirmation
              </li>
              <li>
                <strong>Account Status:</strong> Your account will be downgraded
                to free tier or cancelled
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Partial Refunds
            </h2>
            <p className="text-gray-700 mb-4">
              In certain circumstances, we may offer partial refunds:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Service issues affecting only part of the billing period</li>
              <li>Downgrading from a higher-tier plan mid-cycle</li>
              <li>Special circumstances approved by our support team</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Data After Cancellation
            </h2>
            <p className="text-gray-700 mb-4">After cancellation or refund:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Your account will be downgraded to the free tier</li>
              <li>You'll retain access to your documents and data</li>
              <li>You can reactivate your subscription at any time</li>
              <li>Data is retained for 90 days after cancellation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Disputes and Chargebacks
            </h2>
            <p className="text-gray-700 mb-4">
              If you believe a charge is incorrect, please contact us first
              before disputing the charge with your bank or credit card company.
              We're committed to resolving any billing issues quickly and
              fairly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this refund policy from time to time. Changes will
              be effective immediately upon posting. We encourage you to review
              this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              For questions about refunds or cancellations, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> support@om2chat.com
                <br />
                <strong>Response Time:</strong> Within 24 hours
                <br />
                <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM
                EST
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Additional Information
            </h2>
            <p className="text-gray-700 mb-4">
              This refund policy is part of our{' '}
              <Link
                href="/legal/terms"
                className="text-[#38b6ff] hover:underline"
              >
                Terms of Service
              </Link>
              . By using our service, you agree to the terms outlined in this
              policy.
            </p>
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
