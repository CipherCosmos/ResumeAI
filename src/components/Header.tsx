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
          <nav className={`md:flex items-center gap-6 ${mobileOpen ? 'absolute top-16 left-0 w-full flex-col bg-background/95 backdrop-blur-md p-6 border-b shadow-xl md:static md:w-auto md:p-0 md:bg-transparent md:border-none md:shadow-none' : 'hidden'}`}>
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`relative text-sm font-medium transition-all duration-200 py-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-[21px] left-0 w-full h-[2px] bg-primary rounded-t-full hidden md:block" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <ThemeToggle />
              <div className="h-5 w-px bg-border hidden md:block" />
              <UserMenu />
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="h-5 w-px bg-border" />
              <Link href="/auth/signin">
                <Button size="sm" className="gap-2 h-9 px-4">
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
