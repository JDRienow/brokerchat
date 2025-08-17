import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rent Roll & T-12 Q&A for CRE | om2chat',
  description:
    'Turn rent rolls and T-12s into instant answers. Share a chat link and qualify faster.',
  alternates: {
    canonical: 'https://www.om2chat.com/use-cases/rent-roll-t12-chat',
  },
};

export default function Page() {
  return (
    <main className="px-4 py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">
          Rent Roll &amp; T-12 Q&amp;A for CRE
        </h1>
        <p className="text-gray-700 mb-6">
          Upload rent rolls and T-12s, then share a public chat link. Buyers ask
          questions and receive cited answers from the documents, letting you
          prioritize serious inquiries.
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
        <h2 className="text-2xl font-semibold mb-3">Typical questions</h2>
        <ul className="list-disc pl-6 text-gray-700 mb-6">
          <li>Delinquencies, concessions, and move-out activity</li>
          <li>NOI trends and expense line variances</li>
          <li>Rent growth and occupancy changes over time</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-3">Related use cases</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <Link
              href="/use-cases/offering-memorandum-chat"
              className="underline"
            >
              Offering Memorandum chatbot
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
