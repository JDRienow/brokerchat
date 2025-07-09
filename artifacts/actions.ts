'use server';

import { supabase } from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';

export async function getSuggestions({
  documentId,
}: { documentId: string }): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from('Suggestion')
    .select('*')
    .eq('documentId', documentId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }

  return data || [];
}
