import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/db/queries';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  try {
    // Get the most recent document from the database
    const { data: documents, error } = await supabase
      .from('document_metadata')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching documents:', error);
      // Fallback to document upload page if there's an error
      redirect('/process-document');
    }

    if (documents && documents.length > 0) {
      // Redirect to the most recent document
      const latestDocument = documents[0];
      redirect(`/chat/${latestDocument.id}`);
    } else {
      // No documents exist, redirect to document upload page
      redirect('/process-document');
    }
  } catch (error) {
    console.error('Error in homepage:', error);
    // Fallback to document upload page
    redirect('/process-document');
  }
}
