'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X, ChevronRight, Orbit, Cpu } from 'lucide-react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/builder', label: 'Builder' },
  { href: '/dashboard', label: 'My Resumes' },
  { href: '/ats-tracker', label: 'ATS Tracker' },
  { href: '/jobs', label: 'Jobs' },
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
        <Link href="/" className="flex items-center gap-6 transition-all hover:scale-105 group relative">
          <div className="relative flex h-16 w-16 items-center justify-center perspective-[1000px]">
            {/* Outer Orbital Ring (Slow + Tilt) */}
            <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_8s_linear_infinite] rotate-x-[60deg]" />
            
            {/* Middle Complex Ring (Fast reverse + Pulse) */}
            <div className="absolute inset-2 border-[2px] border-white/10 rounded-full border-t-primary/60 animate-[spin_3s_linear_infinite_reverse] rotate-y-[45deg]" />
            
            {/* Scanning Radar Beam */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgba(var(--primary-rgb),0.2)_50%,transparent_100%)] animate-[spin_4s_linear_infinite]" />
            
            {/* Satellite Particle (Trailing) */}
            <div className="absolute inset-0 animate-[spin_2.5s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),1)] rounded-full border border-white/40" />
            </div>
 
            {/* Inner Glitch Core */}
            <div className="absolute inset-4 border border-primary/40 rounded-full animate-pulse blur-[1px]" />
            
            {/* Central Icon - Fixed Geometry with Glitch on group hover */}
            <div className="relative z-10 flex h-9 w-9 items-center justify-center bg-zinc-950 text-white shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] border border-primary/40 group-hover:border-primary group-hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.8)] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
              <div className="relative z-10 flex items-center justify-center group-hover:animate-[wiggle_0.2s_ease-in-out_infinite]">
                <Cpu size={20} className="text-primary group-hover:text-white transition-colors" />
              </div>
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] animate-[scanline_1s_linear_infinite] opacity-20 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-4xl font-black tracking-[-0.1em] uppercase italic leading-none text-white relative group-hover:text-primary transition-colors">
              ORBITAL
              <span className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
              {/* Glint effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-[glint_3s_linear_infinite] pointer-events-none" />
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[2px] w-6 bg-gradient-to-r from-primary to-transparent" />
              <span className="text-[0.5rem] font-black uppercase tracking-[0.5em] text-zinc-500 group-hover:text-primary/70 transition-colors">Neural Terminal</span>
            </div>
          </div>
        </Link>

        {session && (
          <nav className={`md:flex items-center gap-12 ${mobileOpen ? 'absolute top-20 left-0 w-full flex-col bg-zinc-950/98 backdrop-blur-3xl p-10 border-b border-white/10 shadow-2xl md:static md:w-auto md:p-0 md:bg-transparent md:border-none md:shadow-none animate-in slide-in-from-top-6 duration-500' : 'hidden'}`}>
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`relative text-[0.65rem] font-black uppercase tracking-[0.35em] transition-all py-2 group ${isActive ? 'text-primary' : 'text-zinc-400 hover:text-white'}`}
                  onClick={() => setMobileOpen(false)}>
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[3px] bg-primary transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-6">
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
              <Button size="lg" className="h-12 px-10 bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-widest text-[0.65rem] skew-x-[-15deg] transition-all shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] hover:shadow-primary/50 group border-none">
                <span className="skew-x-[15deg] flex items-center gap-3 group-hover:translate-x-1 transition-transform">Initialize Neural Link <ChevronRight size={14} /></span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
