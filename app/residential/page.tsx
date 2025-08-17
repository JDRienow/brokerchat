import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Chat for Real Estate Agents (Disclosures & Packets) | om2chat',
  description:
    'Let clients ask questions about listing packets, disclosures, and HOA docs with citations.',
  alternates: {
    canonical: 'https://www.om2chat.com/residential',
  },
};

export default function Page() {
  return (
    <main className="px-4 py-12">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">AI for Real Estate Agents</h1>
        <p className="text-gray-700 mb-6">
          Share a chat link for buyers to ask questions about disclosures, listing packets, and HOA documents.
          Answers include citations so clients trust the source.
        </p>
        <div className="flex gap-3 mb-10">
          <Link href="/register" className="inline-flex items-center justify-center rounded-md bg-gray-900 text-white px-5 py-3">Start Free</Link>
          <Link href="/contact-sales" className="inline-flex items-center justify-center rounded-md border px-5 py-3">Book demo</Link>
        </div>
        <h2 className="text-2xl font-semibold mb-3">Great for</h2>
        <ul className="list-disc pl-6 text-gray-700 mb-6">
          <li>Listing packets and buyer handouts</li>
          <li>HOA CC&Rs and community docs</li>
          <li>Seller disclosures and inspection reports</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-3">Related use cases</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li><Link href="/use-cases/offering-memorandum-chat" className="underline">OM chatbot</Link></li>
          <li><Link href="/use-cases/rent-roll-t12-chat" className="underline">Rent roll &amp; T-12 Q&amp;A</Link></li>
          <li><Link href="/use-cases/client-portal-alternative" className="underline">Client portal alternative</Link></li>
        </ul>
      </div>
    </main>
  );
}


