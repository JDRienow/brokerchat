import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offering Memorandum (OM) Chatbot for CRE | om2chat',
  description:
    'Chat with your OM PDF. Buyers ask; AI answers with citations. Share a link and track interest.',
  alternates: {
    canonical: 'https://www.om2chat.com/use-cases/offering-memorandum-chat',
  },
};

export default function Page() {
  return (
    <main className="px-4 py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">
          Offering Memorandum (OM) Chatbot for CRE
        </h1>
        <p className="text-gray-700 mb-6">
          Turn your Offering Memorandum into an interactive Q&amp;A experience.
          Upload your OM PDF, share a public chat link, and let buyers ask
          questions with cited answers from the source pages.
        </p>
        <div className="flex gap-3 mb-10">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 text-white px-5 py-3"
          >
            Start Free
          </Link>
          <Link
            href="/contact-sales"
            className="inline-flex items-center justify-center rounded-md border px-5 py-3"
          >
            Book demo
          </Link>
        </div>
        <h2 className="text-2xl font-semibold mb-3">Why OM chatbot</h2>
        <p className="text-gray-700 mb-4">
          Buyers get instant, accurate answers; you capture engagement data to
          qualify faster. No downloads required, just a link.
        </p>
        <h2 className="text-2xl font-semibold mb-3">What you can ask</h2>
        <ul className="list-disc pl-6 text-gray-700 mb-6">
          <li>Unit mix, parking ratios, capex summaries</li>
          <li>Lease expirations, rent escalations, tenant overviews</li>
          <li>Financial highlights with page citations</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-3">Related use cases</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <Link href="/use-cases/rent-roll-t12-chat" className="underline">
              Rent roll &amp; T-12 Q&amp;A
            </Link>
          </li>
          <li>
            <Link
              href="/use-cases/client-portal-alternative"
              className="underline"
            >
              Client portal alternative
            </Link>
          </li>
          <li>
            <Link href="/residential" className="underline">
              AI for agents
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
