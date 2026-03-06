'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Lock, Shield, Loader2, Save, Trash2, AlertTriangle, CreditCard, Link as LinkIcon, Briefcase } from 'lucide-react';

type ProfileTab = 'account' | 'security' | 'connections' | 'billing';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState<string | null>(null);
  const [billingMsg, setBillingMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated' && session.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
      setLoading(false);
    }
  }, [status, session, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      setProfileMsg(res.ok ? '✓ Profile updated successfully' : data.error || 'Update failed');
    } catch {
      setProfileMsg('Something went wrong');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg('✓ Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg(data.error || 'Password change failed');
      }
    } catch {
      setPasswordMsg('Something went wrong');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddCredits = async (packageId: string) => {
    setBillingMsg('');
    setBillingLoading(packageId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setBillingMsg(data.error || 'Failed to initiate checkout');
      }
    } catch {
      setBillingMsg('Something went wrong during checkout initialization');
    } finally {
      setBillingLoading(null);
    }
  };

  const handleConnect = (provider: string) => {
    signIn(provider, { callbackUrl: '/profile' });
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    const res = await fetch('/api/user', { method: 'DELETE' });
    if (res.ok) {
      signOut({ callbackUrl: '/auth/signin' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 size={28} className="spin-icon" style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your account, password, and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex flex-col gap-1 p-4 bg-card text-card-foreground border shadow-sm rounded-xl shrink-0">
          <button type="button" className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === 'account' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`} onClick={() => setTab('account')}>
            <User size={18} /> Account Details
          </button>
          <button type="button" className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === 'security' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`} onClick={() => setTab('security')}>
            <Lock size={18} /> Security
          </button>
          <button type="button" className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === 'connections' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`} onClick={() => setTab('connections')}>
            <LinkIcon size={18} /> Connections
          </button>
          <button type="button" className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === 'billing' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`} onClick={() => setTab('billing')}>
            <CreditCard size={18} /> Billing & Plans
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 w-full">
          {tab === 'account' && (
            <div className="animate-slide-up">
              {/* Profile Info */}
              <section className="bg-card text-card-foreground border shadow-sm rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-xl font-semibold border-b pb-4">
                  <User size={18} />
                  <h2 className="m-0 text-xl font-semibold">Personal Information</h2>
                </div>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none mb-1 block">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none mb-1 block">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="you@example.com" />
                  </div>
                  {profileMsg && <p className={`p-3 text-sm font-medium rounded-md ${profileMsg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>{profileMsg}</p>}
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" disabled={profileLoading}>
                    {profileLoading ? <><Loader2 size={16} className="spin-icon" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                  </button>
                </form>
              </section>

              {/* Danger Zone */}
              <section className="bg-destructive/5 border-destructive/20 border shadow-sm rounded-xl p-6 mt-8">
                <div className="flex items-center gap-2 mb-6 text-xl font-semibold border-b pb-4">
                  <AlertTriangle size={18} />
                  <h2 className="m-0 text-xl font-semibold">Danger Zone</h2>
                </div>
                <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '1rem' }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2" onClick={handleDeleteAccount}>
                  <Trash2 size={16} /> Delete Account
                </button>
              </section>
            </div>
          )}

          {tab === 'security' && (
            <div className="animate-slide-up">
              {/* Change Password */}
              <section className="bg-card text-card-foreground border shadow-sm rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-xl font-semibold border-b pb-4">
                  <Lock size={18} />
                  <h2 className="m-0 text-xl font-semibold">Change Password</h2>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none mb-1 block">Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none mb-1 block">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" minLength={6} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none mb-1 block">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" minLength={6} required />
                  </div>
                  {passwordMsg && <p className={`p-3 text-sm font-medium rounded-md ${passwordMsg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>{passwordMsg}</p>}
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" disabled={passwordLoading}>
                    {passwordLoading ? <><Loader2 size={16} className="spin-icon" /> Changing...</> : <><Shield size={16} /> Change Password</>}
                  </button>
                </form>
              </section>
            </div>
          )}

          {tab === 'connections' && (
            <div className="animate-slide-up">
              <section className="bg-card text-card-foreground border shadow-sm rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-xl font-semibold border-b pb-4">
                  <LinkIcon size={18} />
                  <h2 className="m-0 text-xl font-semibold">Linked Accounts</h2>
                </div>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                  Connect your social accounts to log in quickly without a password.
                </p>
                
                <div className="flex flex-col gap-4">
                  {/* Google */}
                  <div className="connection-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-center gap-4">
                      <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      <div>
                        <div style={{ fontWeight: 600 }}>Google</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Not connected</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConnect('google')}
                      className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Connect
                    </button>
                  </div>

                  {/* GitHub */}
                  <div className="connection-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-center gap-4">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      <div>
                        <div style={{ fontWeight: 600 }}>GitHub</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Not connected</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConnect('github')}
                      className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Connect
                    </button>
                  </div>
                  
                  {/* LinkedIn */}
                  <div className="connection-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-center gap-4">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="#0077b5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      <div>
                        <div style={{ fontWeight: 600 }}>LinkedIn</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Not connected</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConnect('linkedin')}
                      className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
 
          {tab === 'billing' && (
            <div className="animate-slide-up">
              {/* Billing & Pricing */}
              <section className="bg-card text-card-foreground border shadow-sm rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6 text-xl font-semibold border-b pb-4">
                  <Briefcase size={18} />
                  <h2 className="m-0 text-xl font-semibold">Available Plans</h2>
                </div>
                <div className="w-full">
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                    Choose a plan to top up your AI tokens.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="flex flex-col p-6 bg-card text-card-foreground border shadow-sm rounded-xl relative overflow-hidden">
              <div className="mb-4">
                <h3>Starter</h3>
                <div className="text-4xl font-extrabold mt-2">$5</div>
              </div>
              <div className="text-sm font-medium text-muted-foreground mb-6 pb-6 border-b">50 Tokens</div>
              <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
                <li>~25 Resume Generations</li>
                <li>Full ATS Scoring</li>
                <li>AI Cover Letters</li>
              </ul>
              <button 
                type="button" 
                onClick={() => handleAddCredits('starter')} 
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full" 
                disabled={billingLoading !== null}
              >
                {billingLoading === 'starter' ? <><Loader2 size={16} className="spin-icon" /> Redirecting...</> : 'Buy Starter'}
              </button>
            </div>
 
            {/* Pro Plan */}
            <div className="flex flex-col p-6 bg-card text-card-foreground border-2 border-primary shadow-md rounded-xl relative overflow-hidden transform md:-translate-y-2">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">Most Popular</div>
              <div className="mb-4">
                <h3>Professional</h3>
                <div className="text-4xl font-extrabold mt-2">$15</div>
              </div>
              <div className="text-sm font-medium text-muted-foreground mb-6 pb-6 border-b">200 Tokens</div>
              <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
                <li>~100 Resume Generations</li>
                <li>Priority Support</li>
                <li>Unlimited Bullet Rewrites</li>
              </ul>
              <button 
                type="button" 
                onClick={() => handleAddCredits('professional')} 
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full" 
                disabled={billingLoading !== null}
              >
                {billingLoading === 'professional' ? <><Loader2 size={16} className="spin-icon" /> Redirecting...</> : 'Buy Professional'}
              </button>
            </div>
 
            {/* Elite Plan */}
            <div className="flex flex-col p-6 bg-card text-card-foreground border shadow-sm rounded-xl relative overflow-hidden">
              <div className="mb-4">
                <h3>Elite</h3>
                <div className="text-4xl font-extrabold mt-2">$30</div>
              </div>
              <div className="text-sm font-medium text-muted-foreground mb-6 pb-6 border-b">500 Tokens</div>
              <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
                <li>~250 Resume Generations</li>
                <li>Enterprise Grade</li>
                <li>Early feature access</li>
              </ul>
              <button 
                type="button" 
                onClick={() => handleAddCredits('elite')} 
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full" 
                disabled={billingLoading !== null}
              >
                {billingLoading === 'elite' ? <><Loader2 size={16} className="spin-icon" /> Redirecting...</> : 'Buy Elite'}
              </button>
            </div>
          </div>
          
          {billingMsg && <div className={`mt-4 p-3 text-sm font-medium rounded-md ${billingMsg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>{billingMsg}</div>}
        </div>
      </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
