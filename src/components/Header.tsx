'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X, LogIn, ChevronRight } from 'lucide-react';
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
    <header className="fixed top-0 z-[100] w-full border-b border-white/5 bg-background/40 backdrop-blur-2xl transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-4 transition-all hover:scale-105 group">
          <div className="flex h-12 w-12 items-center justify-center bg-primary text-white skew-x-[-12deg] shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] transition-all">
            <div className="skew-x-[12deg]"><Sparkles size={24} /></div>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic italic">Resume<span className="text-primary">AI</span></span>
        </Link>

        {session && (
          <nav className={`md:flex items-center gap-10 ${mobileOpen ? 'absolute top-20 left-0 w-full flex-col bg-zinc-950/95 backdrop-blur-2xl p-10 border-b border-white/10 shadow-2xl md:static md:w-auto md:p-0 md:bg-transparent md:border-none md:shadow-none animate-in slide-in-from-top-4 duration-300' : 'hidden'}`}>
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`relative text-[0.7rem] font-black uppercase tracking-[0.3em] transition-all py-2 group ${isActive ? 'text-primary' : 'text-zinc-400 hover:text-white'}`}
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[2px] bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6">
            <ThemeToggle />
            <div className="h-4 w-[1px] bg-white/10" />
          </div>
          
          {session ? (
            <>
              <UserMenu />
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[0.7rem] skew-x-[-12deg] transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                <span className="skew-x-[12deg] flex items-center gap-2">Initialize <ChevronRight size={14} /></span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
