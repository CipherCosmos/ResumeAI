'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, CreditCard, ChevronDown, Coins, Sparkles } from 'lucide-react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') return null;

  if (!session?.user) {
    return (
      <a href="/auth/signin" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
        <User size={14} /> Sign In
      </a>
    );
  }

  const credits = (session.user as { credits?: number }).credits ?? 0;

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="user-menu-trigger" onClick={() => setOpen(!open)} type="button">
        <div className="user-avatar">{session.user.name?.[0]?.toUpperCase() || '?'}</div>
        <div className="user-menu-info">
          <span className="user-menu-name">{session.user.name || session.user.email}</span>
          <span className="user-menu-credits"><Coins size={10} /> {credits} tokens</span>
        </div>
        <ChevronDown size={14} style={{ opacity: 0.4, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="user-menu-dropdown animate-fade-in">
          <div className="user-menu-credit-display">
            <CreditCard size={16} />
            <div>
              <span className="credit-balance">{credits}</span>
              <span className="credit-label">Billing Balance</span>
            </div>
          </div>
          <div className="user-menu-divider" />
          <Link href="/dashboard?purchase=true" className="user-menu-item" onClick={() => setOpen(false)}>
            <Sparkles size={14} className="text-primary" /> Get More Tokens
          </Link>
          <button className="user-menu-item" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
