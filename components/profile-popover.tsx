'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import type { User } from 'next-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/toast';
import { UserIcon, CrossIcon } from '@/components/icons';
import { guestRegex } from '@/lib/constants';

interface ProfilePopoverProps {
  user: User | null | undefined;
  variant?: 'default' | 'compact';
}

export function ProfilePopover({
  user,
  variant = 'default',
}: ProfilePopoverProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Return null if no user provided (e.g., on public pages)
  if (!user) {
    return null;
  }

  const isGuest = guestRegex.test(session?.user?.email ?? '');

  const handleEditProfile = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await signOut({
        redirectTo: '/login',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to logout. Please try again.',
      });
    }
  };

  if (isGuest) {
    return (
      <Button
        variant="ghost"
        onClick={() => router.push('/login')}
        className="h-8 w-8 rounded-full p-0"
      >
        <UserIcon />
        <span className="sr-only">Login</span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 rounded-full p-1.5 hover:bg-muted border border-border/50"
        >
          <UserIcon />
          <span className="sr-only">Open profile menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-0" align="end">
        {/* User Info Section */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted border border-border/50 flex items-center justify-center">
              <UserIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.email || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email || ''}
              </p>
              {user.company_name && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.company_name}
                </p>
              )}
            </div>
          </div>
        </div>

        <DropdownMenuItem
          onClick={handleEditProfile}
          className="cursor-pointer"
        >
          <UserIcon />
          <span className="ml-2">Edit Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <CrossIcon />
          <span className="ml-2">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
