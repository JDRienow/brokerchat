'use client';

import { useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';

export function SidebarHistory({ user }: { user: User | undefined }) {
  const router = useRouter();

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to manage your documents!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // For broker app, direct users to dashboard for document management
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="px-2 text-zinc-500 w-full flex flex-col justify-center items-center text-sm gap-2">
          <div>Manage your documents and client chats from the dashboard.</div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
