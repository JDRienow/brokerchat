import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Client Portal Alternative for Real Estate | om2chat',
  description:
    'Replace endless emails with a shareable chat link, analytics, and cited answers.',
  alternates: {
    canonical: 'https://www.om2chat.com/use-cases/client-portal-alternative',
  },
};

export default function Page() {
  return (
    <main className="px-4 py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">
          Client Portal Alternative for Real Estate
        </h1>
        <p className="text-gray-700 mb-6">
          Share a single link where clients ask questions and receive cited
          answers from your PDFs. Get analytics on engagement instead of digging
          through email threads.
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
        <h2 className="text-2xl font-semibold mb-3">Why replace portals</h2>
        <p className="text-gray-700 mb-4">
          Clients want answers, not logins. om2chat gives them both—fast answers
          and transparent citations.
        </p>
        <h2 className="text-2xl font-semibold mb-3">Related use cases</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <Link
              href="/use-cases/offering-memorandum-chat"
              className="underline"
            >
              OM chatbot
            </Link>
          </li>
          <li>
            <Link href="/use-cases/rent-roll-t12-chat" className="underline">
              Rent roll &amp; T-12 Q&amp;A
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
