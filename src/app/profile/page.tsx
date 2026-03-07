'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { User, Lock, Shield, Loader2, Save, Trash2, AlertTriangle, CreditCard, Link as LinkIcon, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Coins } from 'lucide-react';

type ProfileTab = 'account' | 'security' | 'connections' | 'billing';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState('');
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
      setPhone((session.user as any).phone || '');
      setAddress((session.user as any).address || '');
      setImage(session.user.image || '');
      setLoading(false);
    }
  }, [status, session, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileLoading(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, image }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg('✓ Profile updated successfully');
        update(); // Refresh NextAuth session
      } else {
        setProfileMsg(data.error || 'Update failed');
      }
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
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        setBillingMsg(data.error || 'Failed to initiate checkout');
        setBillingLoading(null);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'AI Resume Builder',
        description: data.name,
        order_id: data.id,
        handler: async function (response: any) {
             setBillingLoading(packageId); 
             try {
                const verifyRes = await fetch('/api/razorpay/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        tokens: data.tokens 
                    }),
                });
                
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                    setBillingMsg('Payment successful! Credits added.');
                    update(); // force session refresh if credits are stored there
                } else {
                    setBillingMsg('Payment Verification Failed: ' + verifyData.error);
                }
             } catch (err) {
                 setBillingMsg('Error verifying payment.');
             } finally {
                 setBillingLoading(null);
             }
        },
        prefill: {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
        },
        theme: {
            color: '#0f172a', 
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch {
      setBillingMsg('Something went wrong during checkout initialization');
    } finally {
      if (document.querySelector('.razorpay-container')) {
         setBillingLoading(null); 
      }
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      // Fetch NextAuth CSRF token required for POST requests
      const csrfRes = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfRes.json();

      // Launch the empty popup window first so it's not blocked by async await
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popupName = `OAuthPopup_${provider}`;
      const popup = window.open('', popupName, `width=${width},height=${height},left=${left},top=${top}`);

      // Create a hidden form to natively POST to NextAuth's signin endpoint
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/api/auth/signin/${provider}`;
      form.target = popupName;
      form.style.display = 'none';

      // Add CSRF token
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfToken';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);

      // Add callbackUrl (this is where the popup will ultimately land)
      const callbackInput = document.createElement('input');
      callbackInput.type = 'hidden';
      callbackInput.name = 'callbackUrl';
      callbackInput.value = window.location.origin + '/profile';
      form.appendChild(callbackInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // Poll the popup to know when the user finishes authenticating
      if (popup) {
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            update(); // Force UI to refresh bindings 
          } else {
            try {
              // If popup navigates back to our domain, authentication finished (or errored)
              if (popup.location.hostname === window.location.hostname) {
                const path = popup.location.pathname;
                if (path === '/profile' || path.includes('/auth/signin')) {
                  popup.close();
                  clearInterval(timer);
                  update();
                }
              }
            } catch (e) {
              // Cross-origin block expected during external provider auth
            }
          }
        }, 500);
      }
    } catch (err) {
      console.error('Failed to trigger connection popup', err);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${provider} account?`)) return;
    try {
      const res = await fetch('/api/profile/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        update(); // Force NextAuth session refresh to wipe the array
      } else {
        const data = await res.json();
        alert(data.error || `Disconnect failed for ${provider}`);
      }
    } catch {
      alert(`Something went wrong disconnecting ${provider}`);
    }
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
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="container mx-auto px-6 py-12 md:px-8 max-w-6xl">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 italic uppercase">
              Profile Settings
            </h1>
            <p className="text-muted-foreground font-medium text-lg">Manage your identity, security, and AI fuel.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-72 flex flex-col gap-2 p-6 bg-background/60 backdrop-blur border-2 shadow-xl rounded-[2rem] shrink-0 sticky top-12">
            {[
              { id: 'account', icon: User, label: 'Account Details' },
              { id: 'security', icon: Lock, label: 'Security' },
              { id: 'connections', icon: LinkIcon, label: 'Connections' },
              { id: 'billing', icon: CreditCard, label: 'Billing & Plans' }
            ].map((item) => (
              <button 
                key={item.id}
                type="button" 
                className={`flex items-center gap-4 w-full text-left px-5 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${tab === item.id ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]' : 'hover:bg-primary/5 text-muted-foreground hover:text-primary hover:translate-x-1'}`} 
                onClick={() => setTab(item.id as ProfileTab)}
              >
                <item.icon size={18} className={tab === item.id ? 'animate-pulse' : ''} /> {item.label}
              </button>
            ))}
            
            <div className="mt-8 pt-8 border-t-2 border-dashed">
               <Button 
                 variant="ghost" 
                 className="w-full justify-start gap-4 px-5 py-6 rounded-2xl text-destructive hover:bg-destructive/5 hover:text-destructive font-black uppercase tracking-widest text-xs"
                 onClick={() => signOut({ callbackUrl: '/' })}
               >
                 <AlertTriangle size={18} /> Sign Out
               </Button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full space-y-8 min-h-[60vh]">
            {tab === 'account' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <Card className="border-2 shadow-2xl overflow-hidden bg-background rounded-[2.5rem]">
                  <CardHeader className="p-10 bg-zinc-50 dark:bg-zinc-900 border-b relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><User size={120} /></div>
                    <div className="flex items-center gap-4 relative">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                        <User size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Personal Identity</CardTitle>
                        <CardDescription className="font-medium">Information that defines your professional presence.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <form onSubmit={handleProfileUpdate} className="space-y-10">
                      <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                          <div className="h-32 w-32 rounded-[2rem] bg-muted/30 flex items-center justify-center overflow-hidden border-4 border-background shadow-2xl transition-all group-hover:scale-105 duration-500">
                            {image ? (
                              <img src={image} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-5xl font-black text-primary/20">{name?.charAt(0) || 'U'}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-3 rounded-2xl shadow-xl border-2 border-background">
                            <Plus size={16} className="font-bold" />
                          </div>
                        </div>
                        <div className="space-y-4 flex-1 w-full text-zinc-900 dark:text-zinc-100">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Avatar URL</label>
                          <Input 
                            type="url" 
                            value={image} 
                            onChange={e => setImage(e.target.value)} 
                            placeholder="https://images.unsplash.com/..." 
                            className="h-12 border-2 rounded-xl bg-muted/10 font-medium focus:ring-primary"
                          />
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Supports hosted image links only</p>
                        </div>
                      </div>
                    
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-900 dark:text-zinc-100">
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Professional Name</label>
                          <Input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="Alex Johnson" 
                            className="h-12 border-2 rounded-xl bg-muted/10 font-bold focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">System Email <span className="opacity-50">(Locked)</span></label>
                          <Input type="email" value={email} disabled className="h-12 border-2 rounded-xl bg-muted font-bold opacity-70" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Reference</label>
                          <Input 
                            type="tel" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            placeholder="+1 (555) 000-0000" 
                            className="h-12 border-2 rounded-xl bg-muted/10 font-bold"
                          />
                        </div>
                        <div className="space-y-3 text-zinc-900 dark:text-zinc-100">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Location</label>
                          <Input 
                            type="text" 
                            value={address} 
                            onChange={e => setAddress(e.target.value)} 
                            placeholder="London, UK" 
                            className="h-12 border-2 rounded-xl bg-muted/10 font-bold"
                          />
                        </div>
                      </div>
                      
                      {profileMsg && <div className={`p-4 text-center text-xs font-black uppercase tracking-widest rounded-2xl animate-in zoom-in-95 ${profileMsg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 shadow-lg' : 'bg-destructive/10 text-destructive border-2 border-destructive/20 shadow-lg'}`}>{profileMsg}</div>}
                      
                      <div className="flex justify-end pt-6">
                        <Button type="submit" disabled={profileLoading} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all text-sm">
                          {profileLoading ? <Loader2 size={18} className="mr-3 animate-spin" /> : <Save size={18} className="mr-3" />} Update Identity
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-2 border-destructive/20 bg-destructive/5 rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive border border-destructive/20">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-destructive">Termination Zone</CardTitle>
                        <CardDescription className="font-bold opacity-70">
                          This is irreversible. All resumes, credits, and links will be purged.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="p-10 pt-0">
                    <Button variant="destructive" onClick={handleDeleteAccount} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs">
                      <Trash2 size={16} className="mr-2" /> Delete My Data Permanently
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {tab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
                <Card className="border-2 shadow-2xl overflow-hidden bg-background rounded-[2.5rem]">
                  <CardHeader className="p-10 bg-zinc-50 dark:bg-zinc-900 border-b">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                           <Shield size={24} />
                        </div>
                        <div>
                           <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Vault Encryption</CardTitle>
                           <CardDescription className="font-medium text-zinc-900">Keep your professional vault under lock and key.</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <form onSubmit={handlePasswordChange} className="space-y-8 max-w-md text-zinc-900 dark:text-zinc-100">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Original Passcode</label>
                        <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" required className="h-12 border-2 rounded-xl bg-muted/10 font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">New Encryption Key</label>
                        <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} required className="h-12 border-2 rounded-xl bg-muted/10 font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Confirm Key</label>
                        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" minLength={6} required className="h-12 border-2 rounded-xl bg-muted/10 font-bold" />
                      </div>
                      {passwordMsg && <div className={`p-4 text-center text-xs font-black uppercase tracking-widest rounded-2xl animate-in zoom-in-95 ${passwordMsg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-2 border-destructive/20'}`}>{passwordMsg}</div>}
                      <Button type="submit" disabled={passwordLoading} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl text-sm">
                        {passwordLoading ? <Loader2 size={18} className="mr-3 animate-spin" /> : <Lock size={18} className="mr-3" />} Rotate Keys
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'connections' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
                <Card className="border-2 shadow-2xl overflow-hidden bg-background rounded-[2.5rem]">
                  <CardHeader className="p-10 bg-zinc-50 dark:bg-zinc-900 border-b">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                           <LinkIcon size={24} />
                        </div>
                        <div>
                           <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Neural Bridge</CardTitle>
                           <CardDescription className="font-medium">Link external identities for seamless entry.</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-6">
                    {[
                      { id: 'google', name: 'Google Workspace', icon: (props: any) => <svg {...props} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
                      { id: 'github', name: 'GitHub Forge', icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> },
                      { id: 'linkedin', name: 'LinkedIn Professional', icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="#0077b5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> }
                    ].map(provider => {
                      const isConnected = (session?.user as any)?.connectedProviders?.includes(provider.id);
                      return (
                        <div key={provider.id} className="flex items-center justify-between p-6 rounded-2xl border-2 bg-card hover:bg-muted/30 transition-all duration-300">
                          <div className="flex items-center gap-6">
                            <provider.icon className="w-8 h-8 opacity-80" />
                            <div>
                              <div className="font-black italic uppercase tracking-tighter text-lg text-zinc-900 dark:text-zinc-100">{provider.name}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                                {isConnected ? 'Link Active' : 'Disconnected'}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant={isConnected ? 'destructive' : 'outline'} 
                            className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 border-2 shadow-sm"
                            onClick={() => isConnected ? handleDisconnect(provider.id) : handleConnect(provider.id)}
                          >
                            {isConnected ? <Trash2 size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
                            {isConnected ? 'Kill' : 'Bridge'}
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
 
            {tab === 'billing' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
                <Card className="border-2 shadow-2xl overflow-hidden bg-background rounded-[2.5rem]">
                  <CardHeader className="p-10 bg-zinc-50 dark:bg-zinc-900 border-b relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Briefcase size={120} /></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">AI Munition</CardTitle>
                          <CardDescription className="font-medium text-zinc-900">Configure your resource pipeline.</CardDescription>
                        </div>
                      </div>
                      <div className="inline-flex items-center justify-center px-8 py-4 border-2 rounded-2xl bg-zinc-900 text-zinc-50 font-black text-xs uppercase tracking-widest shadow-xl">
                        Vault Balance: <strong className="ml-3 text-primary text-lg">{(session?.user as any)?.credits ?? 0} Credits</strong>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {[
                         { id: 'starter', name: 'Starter', price: '$5', tokens: '50', perks: ['~25 Generations', 'ATS Scoring', 'Core AI'] },
                         { id: 'professional', name: 'Pro Pack', price: '$15', tokens: '200', perks: ['~100 Generations', 'Priority Link', 'Deep Polish'], featured: true },
                         { id: 'elite', name: 'Elite', price: '$30', tokens: '500', perks: ['~250 Generations', 'Unlimited Flux', 'VIP Access'] }
                       ].map(pkg => (
                         <div key={pkg.id} className={`flex flex-col p-8 bg-card text-card-foreground border-2 shadow-lg rounded-[2.5rem] relative overflow-hidden transition-all duration-300 hover:scale-[1.05] ${pkg.featured ? 'border-primary bg-primary/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                            {pkg.featured && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-2xl">Target</div>}
                            <div className="mb-6">
                              <h3 className="font-black italic uppercase tracking-tighter text-xl">{pkg.name}</h3>
                              <div className="text-4xl font-black mt-2 tracking-tighter">{pkg.price}</div>
                            </div>
                            <div className="text-xs font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                               <Coins size={14} /> {pkg.tokens} AI Tokens
                            </div>
                            <ul className="space-y-4 mb-10 flex-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                              {pkg.perks.map((perk, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full" /> {perk}
                                </li>
                              ))}
                            </ul>
                            <Button 
                              variant={pkg.featured ? 'default' : 'outline'} 
                              onClick={() => handleAddCredits(pkg.id)} 
                              disabled={billingLoading !== null}
                              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                            >
                              {billingLoading === pkg.id ? <Loader2 size={16} className="mr-2 animate-spin" /> : `Deploy ${pkg.name}`}
                            </Button>
                         </div>
                       ))}
                    </div>
                    
                    {billingMsg && <div className={`mt-10 p-6 text-xs font-black uppercase tracking-widest rounded-[2rem] text-center shadow-xl animate-in zoom-in-95 ${billingMsg.startsWith('Payment successful') ? 'bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-2 border-destructive/20'}`}>{billingMsg}</div>}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
