'use client';

import React, { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Sparkles, ArrowRight, User, Github, Linkedin, ChevronLeft } from 'lucide-react';
import { useMousePosition } from '@/hooks/useMousePosition';
import Link from 'next/link';

type Tab = 'signin' | 'register';

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const mouse = useMousePosition();
  const bgRef = useRef<HTMLDivElement>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || email.split('@')[0], email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      setLoading(false);

      if (result?.error) {
        setError('Account created! Please sign in.');
        setTab('signin');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Interactive Background */}
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x}px ${mouse.y}px, rgba(var(--primary-rgb), 0.15), transparent 70%)`
        }}
      />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />
      
      <Link href="/" className="absolute top-8 left-8 z-10 hidden md:flex items-center gap-2 text-sm font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
        <ChevronLeft size={16} /> Back to Base
      </Link>

      <div className="relative z-10 w-full max-w-[450px]">
        <div className="bg-zinc-900/40 backdrop-blur-2xl border-2 border-white/5 rounded-[2.5rem] p-10 md:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transition-all animate-in fade-in zoom-in duration-500">
          
          {/* Logo & Branding */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-glow animate-pulse">
              <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic italic">Resume<span className="text-primary">AI</span></h1>
            <p className="text-zinc-500 text-sm font-medium mt-2 tracking-tight">Deploy your career with precision.</p>
          </div>

          {/* Tab Switch */}
          <div className="flex p-1.5 bg-black/40 rounded-2xl mb-10 border border-white/5">
            <button 
              type="button" 
              className={`flex-1 flex items-center justify-center py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${tab === 'signin' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              onClick={() => { setTab('signin'); setError(''); }}
            >
              Sign In
            </button>
            <button 
              type="button" 
              className={`flex-1 flex items-center justify-center py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${tab === 'register' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              onClick={() => { setTab('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-4 mb-8 text-xs font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
               <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> {error}
            </div>
          )}

          <form onSubmit={tab === 'signin' ? handleSignIn : handleRegister} className="space-y-6">
            {tab === 'register' && (
              <div className="space-y-2">
                <label className="text-[0.65rem] font-bold uppercase tracking-[0.3em] opacity-40 ml-2">Identity</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/20 border-2 border-white/5 rounded-2xl h-14 pl-12 pr-4 text-sm font-medium focus:border-primary focus:bg-black/40 transition-all outline-none" 
                    placeholder="Full Name" 
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold uppercase tracking-[0.3em] opacity-40 ml-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/20 border-2 border-white/5 rounded-2xl h-14 pl-12 pr-4 text-sm font-medium focus:border-primary focus:bg-black/40 transition-all outline-none" 
                  placeholder="name@company.com" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold uppercase tracking-[0.3em] opacity-40 ml-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/20 border-2 border-white/5 rounded-2xl h-14 pl-12 pr-4 text-sm font-medium focus:border-primary focus:bg-black/40 transition-all outline-none" 
                  placeholder="••••••••" 
                  required 
                  minLength={tab === 'signin' ? 4 : 6}
                />
              </div>
            </div>

            {tab === 'register' && (
              <div className="space-y-2">
                <label className="text-[0.65rem] font-bold uppercase tracking-[0.3em] opacity-40 ml-2">Verify Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/20 border-2 border-white/5 rounded-2xl h-14 pl-12 pr-4 text-sm font-medium focus:border-primary focus:bg-black/40 transition-all outline-none" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <>{tab === 'signin' ? 'Initialize Session' : 'Create Intelligence'} <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="relative my-10 flex items-center">
            <div className="flex-1 border-t border-white/10" />
            <span className="px-4 text-[0.6rem] font-black uppercase tracking-[0.4em] opacity-30">Neural Bridge</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => handleOAuth('google')} className="h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center transition-all group">
              <svg viewBox="0 0 24 24" width="20" height="20" className="group-hover:scale-110 transition-transform"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.32-2.23 4.41-1.03.85-2.67 1.63-5.61 1.63-5.5 0-9.91-4.48-9.91-9.96s4.41-9.96 9.91-9.96c2.97 0 5.2 1.14 6.8 2.67l2.23-2.22C19.11 1.95 16.03.5 12.48.5 5.86.5.5 5.88.5 12.5s5.36 12 11.98 12c3.54 0 6.22-1.17 8.35-3.37 2.22-2.2 2.91-5.32 2.91-7.85 0-.75-.07-1.46-.21-2.07h-11.05z"/></svg>
            </button>
            <button onClick={() => handleOAuth('github')} className="h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center transition-all group">
              <Github size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            <button onClick={() => handleOAuth('linkedin')} className="h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center transition-all group">
              <Linkedin size={20} style={{ color: '#0077b5' }} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <p className="mt-12 text-center text-[0.65rem] font-black uppercase tracking-widest opacity-30">
            Secure multi-factor authentication active.
          </p>
        </div>
        
        <p className="mt-8 text-center text-xs font-medium text-zinc-500">
          New deployments receive <span className="text-primary font-black uppercase tracking-tighter italic">10 Free Credits</span> to initialize.
        </p>
      </div>
    </div>
  );
}
