'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ProfilePopover } from '@/components/profile-popover';
import { Button } from '@/components/ui/button';
import { HomeIcon } from '@/components/icons';

interface GlobalHeaderProps {
  title?: string;
  showHomeLink?: boolean;
  className?: string;
}

export function GlobalHeader({
  title,
  showHomeLink = true,
  className = 'border-b bg-background',
}: GlobalHeaderProps) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <header
      className={`flex items-center justify-between px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        {showHomeLink && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <HomeIcon size={16} />
              <span className="ml-2 hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
        )}
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <ProfilePopover user={session?.user} />
      </div>
    </header>
  );
}
