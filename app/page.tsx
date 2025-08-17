import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'om2chat',
  description:
    'Upload OMs, rent rolls, and T-12s. Share a client chat link with cited answers and get buyer insights. Faster qualification, happier clients.',
  alternates: {
    canonical: 'https://www.om2chat.com/',
  },
};
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, MessageSquare, Share2, BarChart3 } from 'lucide-react';
import { PricingSection } from '@/components/pricing-section';
import { FaqItem } from '@/components/faq-item';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/om2chat-logo.svg"
              alt="OM2Chat"
              width={160}
              height={40}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#38b6ff] hover:bg-[#1e40af] text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary/10 text-gray-700 mb-4">
            AI-Powered Document Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Transform Your
            <span className="text-[#38b6ff]"> Real Estate</span>
            <br />
            Documents into
            <span className="text-[#38b6ff]"> Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload CRE PDFs (OMs, rent rolls, T-12s). Share a public chat link
            with cited answers and see buyer insights—no downloads or logins.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                data-analytics-id="cta_click:start_free"
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3"
              >
                Start Free
              </Button>
            </Link>
            <Link href="/contact-sales">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3"
                data-analytics-id="cta_click:book_demo"
              >
                Book demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Smart Upload, AI Chat, Client Sharing, Analytics
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-[#38b6ff]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-[#38b6ff]" />
                </div>
                <CardTitle className="text-xl">Smart Upload</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Upload your PDF offering memorandums and other real estate
                  documents. Our AI extracts and understands everything.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-[#38b6ff]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-[#38b6ff]" />
                </div>
                <CardTitle className="text-xl">AI Chat</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Ask questions about your documents in plain English. Get
                  instant, accurate answers backed by your actual data.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-[#38b6ff]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-6 h-6 text-[#38b6ff]" />
                </div>
                <CardTitle className="text-xl">Client Sharing</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Create secure, branded links to share insights with clients.
                  No downloads or installations required.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-[#38b6ff]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-[#38b6ff]" />
                </div>
                <CardTitle className="text-xl">Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Track engagement, understand client interests, and optimize
                  your presentations with detailed analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How om2chat Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How om2chat Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes, not hours. Here's how om2chat transforms
              your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#38b6ff] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload PDFs</h3>
              <p className="text-gray-600">
                Drag and drop your commercial real estate PDF documents. Simple
                and secure upload process.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#38b6ff] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Share a Chat Link</h3>
              <p className="text-gray-600">
                Ask questions about your documents in natural language. Get
                instant insights and analysis.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#38b6ff] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Buyer Insights</h3>
              <p className="text-gray-600">
                Create branded links to share with clients. Track engagement and
                close deals faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results brokers care about */}
      <section id="results" className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Results brokers care about
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-gray-900">2x</div>
              <p className="text-gray-600">Faster buyer qualification</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">+35%</div>
              <p className="text-gray-600">Higher engagement on shared links</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">0</div>
              <p className="text-gray-600">File downloads required</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            FAQs
          </h2>
          <div className="space-y-4">
            <FaqItem
              id="what-is-om2chat"
              question="What is om2chat?"
              answer={
                <p>
                  om2chat is an AI assistant for commercial real estate
                  documents like Offering Memorandums, rent rolls, and T-12s.
                  Share a public chat link and get cited answers.
                </p>
              }
            />
            <FaqItem
              id="how-sharing-works"
              question="How does sharing work?"
              answer={
                <p>
                  Upload your PDFs and create a shareable link. Buyers can ask
                  questions and receive answers with citations to the source
                  pages.
                </p>
              }
            />
            <FaqItem
              id="which-docs"
              question="Which documents are supported?"
              answer={
                <p>
                  Offering Memorandums, rent rolls, T-12s, site plans, and more.
                  If it’s a PDF, you can likely chat with it.
                </p>
              }
            />
            <FaqItem
              id="security"
              question="Is my data secure?"
              answer={
                <p>
                  Documents are processed securely and links can be revoked at
                  any time. See our Privacy Policy for details.
                </p>
              }
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#38b6ff]">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of commercial real estate professionals who are
            already using om2chat to close more deals and serve their clients
            better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-[#38b6ff] hover:bg-gray-100 px-8 py-3"
              >
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="border-white text-white hover:bg-white hover:text-[#38b6ff] px-8 py-3 bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/images/om2chat-logo.svg"
                alt="OM2Chat"
                width={160}
                height={40}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-400">
                AI-powered document intelligence for commercial real estate
                professionals.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/legal/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/legal/refund" className="hover:text-white">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 OM2Chat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
