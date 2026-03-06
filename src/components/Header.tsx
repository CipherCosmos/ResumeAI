'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X, LogIn } from 'lucide-react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/builder', label: 'Builder' },
  { href: '/dashboard', label: 'My Resumes' },
  { href: '/ats-tracker', label: 'ATS Tracker' },
  { href: '/profile', label: 'Profile' },
];

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 text-base items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">ResumeAI</span>
        </Link>

        {session && (
          <nav className={`md:flex items-center gap-6 ${mobileOpen ? 'absolute top-16 left-0 w-full flex-col bg-background p-4 border-b shadow-lg md:static md:w-auto md:p-0 md:border-none md:shadow-none' : 'hidden'}`}>
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`text-base font-semibold transition-colors hover:text-primary ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <ThemeToggle />
              <UserMenu />
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth/signin">
                <Button size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
