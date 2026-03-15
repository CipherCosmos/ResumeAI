'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import useSWR from 'swr';
import { 
  FileText, 
  Clock, 
  Trash2, 
  Coins, 
  ArrowRight, 
  Loader2, 
  Plus, 
  X, 
  Eye, 
  Share2, 
  Sparkles, 
  Copy, 
  Check, 
  BarChart3, 
  Stars,
  Zap,
  Shield
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const ResumePreview = dynamic(() => import('@/components/ResumePreview'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>
});
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ResumeItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </Suspense>
  );
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: resumesData, error: resumesError, mutate: mutateResumes } = useSWR(
    status === 'authenticated' ? '/api/resumes' : null, 
    fetcher,
    { revalidateOnFocus: true }
  );

  const { data: creditsData, error: creditsError, mutate: mutateCredits } = useSWR(
    status === 'authenticated' ? '/api/credits' : null, 
    fetcher
  );

  const resumes: ResumeItem[] = resumesData?.resumes || [];
  const credits: number = creditsData?.balance || 0;
  const transactions: TransactionItem[] = creditsData?.transactions || [];

  const isLoadingData = (!resumesData && !resumesError) || (!creditsData && !creditsError);

  const totalResumes = resumes.length;
  const avgScore = resumes.length > 0 ? 78 : 0; 

  useEffect(() => {
    if (searchParams?.get('purchase') === 'true') {
      setShowPricing(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const [viewingResume, setViewingResume] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [clResumeId, setClResumeId] = useState<string | null>(null);
  const [clJd, setClJd] = useState('');
  const [clLoading, setClLoading] = useState(false);
  const [clResult, setClResult] = useState<string | null>(null);
  const [clCopied, setClCopied] = useState(false);

  const [showPricing, setShowPricing] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setPurchaseLoading(packageId);
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();

      if (!data.id) {
        toast.error(data.error || 'Failed to start checkout');
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ORBITAL SYSTEMS',
        description: 'Intelligence Unit Deployment',
        order_id: data.id,
        handler: async function (response: any) {
             setPurchaseLoading(packageId);
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
                    toast.success('Payment successful! Credits added to your account.');
                    setShowPricing(false);
                    mutateCredits();
                } else {
                    toast.error('Payment Verification Failed: ' + verifyData.error);
                }
             } catch (err) {
                 toast.error('Error verifying payment.');
             } finally {
                 setPurchaseLoading(null);
             }
        },
        modal: {
             ondismiss: function() {
                 setPurchaseLoading(null);
                 toast.info('Payment cancelled.');
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

    } catch (err) {
      toast.error('Network error while starting checkout.');
    } finally {
      if (document.querySelector('.razorpay-container')) {
         setPurchaseLoading(null); 
      }
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/resumes?id=${deleteConfirmId}`, { method: 'DELETE' });
      if (res.ok) {
        mutateResumes();
        setDeleteConfirmId(null);
        toast.success('Resume deleted successfully.');
      }
    } catch {
      toast.error('Failed to delete resume');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalLoading(true);
    try {
      const res = await fetch(`/api/resumes?id=${id}`);
      if (res.ok) {
        const responseData = await res.json();
        const resume = responseData.resume;
        setViewingResume(resume);
      } else {
        toast.error('Failed to load resume.');
      }
    } catch {
      toast.error('Error loading resume.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!clResumeId) return;
    setClLoading(true);
    try {
      const res = await fetch(`/api/resumes/${clResumeId}/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: clJd }),
      });
      const data = await res.json();
      if (res.ok && data.coverLetter) {
        setClResult(data.coverLetter);
        setClResumeId(null); 
        mutateResumes();
        mutateCredits();
        toast.success('Cover letter generated!');
      } else {
        toast.error(data.error || 'Failed to generate cover letter.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setClLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && isLoadingData)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto custom-scrollbar h-full">
      <div className="container mx-auto px-4 py-6 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white italic uppercase leading-none">
              ORBITAL <span className="text-primary not-italic">DASHBOARD</span> <Sparkles className="text-primary w-5 h-5 animate-pulse" />
            </h1>
            <p className="text-zinc-500 font-bold tracking-tight uppercase text-[0.6rem] opacity-70">
              {session?.user?.name?.split(' ')[0]} {"//"} Balance: {credits} Tokens
            </p>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" onClick={() => setShowPricing(true)} className="font-bold border-2 h-9 px-4 hover:bg-primary/5 transition-all text-xs">
                <Plus size={14} className="mr-1.5" /> Buy Credits
             </Button>
             <Link href="/builder">
                <Button className="font-bold h-9 px-6 shadow-lg hover:scale-105 transition-all text-xs">
                  <Plus size={16} className="mr-1.5" /> Create New
                </Button>
             </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
           <Card className="group border-2 shadow-sm bg-background/60 backdrop-blur -skew-x-2 transition-all hover:skew-x-0 hover:border-primary/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity"><FileText size={80} /></div>
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-1 space-y-0">
                <CardTitle className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 skew-x-2 group-hover:skew-x-0 transition-all"><FileText size={12} className="text-primary" /> Profiles</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 skew-x-2 group-hover:skew-x-0 transition-all">
                <div className="text-2xl font-black text-white italic">{totalResumes}</div>
                <p className="text-[0.5rem] font-black uppercase tracking-widest text-zinc-600 mt-1">Logic Ready</p>
              </CardContent>
           </Card>
           <Card className="group border-2 shadow-sm bg-background/60 backdrop-blur -skew-x-2 transition-all hover:skew-x-0 hover:border-amber-500/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity"><Coins size={80} /></div>
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-1 space-y-0">
                <CardTitle className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 skew-x-2 group-hover:skew-x-0 transition-all"><Coins size={12} className="text-amber-500" /> Fuel</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 skew-x-2 group-hover:skew-x-0 transition-all">
                <div className="text-2xl font-black text-amber-500 italic">{credits}</div>
                <p className="text-[0.5rem] font-black uppercase tracking-widest text-zinc-600 mt-1">Neural Tokens</p>
              </CardContent>
           </Card>
           <Card className="group border-2 shadow-sm bg-background/60 backdrop-blur -skew-x-2 transition-all hover:skew-x-0 hover:border-emerald-500/50 overflow-hidden relative col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity"><BarChart3 size={80} /></div>
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-1 space-y-0">
                <CardTitle className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 skew-x-2 group-hover:skew-x-0 transition-all"><Shield size={12} className="text-emerald-500" /> Compliance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 skew-x-2 group-hover:skew-x-0 transition-all">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-emerald-500 italic">{avgScore}%</div>
                  <div className="flex-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${avgScore}%` }} />
                  </div>
                </div>
              </CardContent>
           </Card>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2 italic uppercase text-zinc-800 dark:text-zinc-200">
              <Clock size={18} className="text-muted-foreground" /> Recent Work
            </h3>
            
            {resumes.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed bg-muted/10 text-center space-y-3">
                  <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center border shadow-sm">
                    <FileText className="text-muted-foreground opacity-50" size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-base italic uppercase tracking-tight">System Empty</h4>
                    <p className="text-muted-foreground text-[0.7rem] max-w-[200px] font-bold uppercase tracking-tight">Deploy your first neural resume profile.</p>
                  </div>
                  <Link href="/builder">
                    <Button variant="outline" className="font-bold border-2 h-8 px-4 text-[0.65rem] uppercase tracking-widest">Initial Boot</Button>
                  </Link>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resumes.map((resume: any) => (
                  <Card key={resume.id} className="group relative border-2 hover:border-primary transition-all duration-300 overflow-hidden shadow-sm bg-background flex flex-col h-full">
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/5 rounded-lg border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <FileText size={18} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-black tracking-tight line-clamp-1">{resume.title || 'Untitled Resume'}</CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-[0.65rem] mt-0.5">
                            <Clock size={10} /> {new Date(resume.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => handleViewResume(resume.id, e)} className="h-8 w-8 hover:text-primary">
                          {modalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Eye size={16} />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => handleDelete(resume.id, e)} className="h-8 w-8 hover:text-error transition-colors">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto p-4 pt-0 flex gap-2">
                       <Link href={`/builder?id=${resume.id}`} className="flex-1">
                          <Button variant="outline" className="w-full font-bold text-xs uppercase tracking-widest border-2 h-9">
                             Edit
                          </Button>
                       </Link>
                       <Button 
                          variant="secondary" 
                          size="sm" 
                          className="font-bold text-xs uppercase tracking-widest h-9 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}/r/${resume.id}`;
                            navigator.clipboard.writeText(url);
                            setCopiedId(resume.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                        >
                          {copiedId === resume.id ? <Check size={14} /> : <Share2 size={14} />}
                       </Button>
                       <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-bold text-xs uppercase tracking-widest h-9 px-3 border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all text-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClResumeId(resume.id);
                            setClJd('');
                          }}
                        >
                          <Sparkles size={14} />
                       </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
             <Card className="border-2 shadow-xl bg-zinc-900 border-white/5 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={120} /></div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-1.5">
                    <Zap size={14} className="text-primary" /> Power Up
                  </CardTitle>
                  <CardDescription className="text-zinc-500 font-bold text-[0.6rem] uppercase tracking-widest mt-1 italic">Quota Near Depletion</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                   <div className="flex items-baseline gap-1.5 mb-4 tracking-tighter text-white font-black">
                      <span className="text-4xl text-primary italic">₹5</span>
                      <span className="text-zinc-500 uppercase text-[0.55rem] tracking-[0.2em] font-black">ELITE PACK</span>
                   </div>
                   <Button onClick={() => setShowPricing(true)} className="w-full h-10 font-black uppercase tracking-widest text-[0.65rem] bg-white text-black hover:bg-primary hover:text-white transition-all shadow-md border-none skew-x-[-10deg]">
                      <span className="skew-x-[10deg]">Deploy Core</span>
                   </Button>
                </CardContent>
             </Card>

             <Card className="border-2 shadow-sm bg-muted/40 backdrop-blur">
                <CardHeader className="p-6">
                   <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-xs"><Sparkles size={16} className="text-primary" /> Career Tips</h4>
                   <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-medium">
                      "Using the <span className="text-foreground font-bold italic underline decoration-primary">XYZ formula</span> can increase your interview callback rate by up to 4x. Our AI is automatically trained on these high-impact patterns."
                   </p>
                </CardHeader>
             </Card>

             {transactions.length > 0 && (
                <Card className="border-2 shadow-sm">
                   <CardHeader className="p-6 pb-2">
                       <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Recent Billing</h4>
                   </CardHeader>
                   <CardContent className="p-0">
                      <div className="divide-y">
                         {transactions.slice(0, 3).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 transition-colors">
                               <span className="text-xs font-bold truncate max-w-[120px] text-zinc-800 dark:text-zinc-200">{tx.description}</span>
                               <span className={`text-xs font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                               </span>
                            </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>
             )}
          </div>
        </div>
      </div>

      {/* Modals Section */}
      
      {/* Pricing */}
      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-3xl shadow-2xl border-2 overflow-hidden bg-background">
            <CardHeader className="relative p-10 bg-zinc-50 dark:bg-zinc-900 border-b">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-background border-2" onClick={() => setShowPricing(false)}>
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="text-4xl font-black tracking-tighter text-center italic uppercase">Top Up Credits</CardTitle>
              <CardDescription className="text-center text-lg font-medium">Choose your fuel for the next career move.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-10 bg-background/50">
              {[
                { id: 'starter', name: 'Starter', tokens: 50, price: '₹5', desc: 'Single job push' },
                { id: 'professional', name: 'Pro', tokens: 200, price: '₹15', desc: 'Active seeker', featured: true },
                { id: 'elite', name: 'Elite', tokens: 500, price: '₹30', desc: 'Max impact' },
              ].map(pkg => (
                <div 
                  key={pkg.id} 
                  className={`relative flex flex-col p-8 rounded-[2rem] border-2 transition-all hover:scale-[1.05] duration-300 ${pkg.featured ? 'border-primary bg-primary/5 shadow-xl' : 'border-border'}`}
                >
                  {pkg.featured && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Recommended</span>}
                  <h4 className="font-black text-xl mb-2 italic uppercase tracking-tighter">{pkg.name}</h4>
                  <div className="text-4xl font-black mb-1 tracking-tighter">{pkg.price}</div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-6">
                    <Coins size={14} /> {pkg.tokens} Tokens
                  </div>
                  <p className="text-xs text-muted-foreground mb-8 font-medium h-8">{pkg.desc}</p>
                  <Button 
                    className="w-full h-12 font-black uppercase tracking-widest text-[0.7rem] shadow-lg" 
                    variant={pkg.featured ? 'default' : 'outline'}
                    disabled={!!purchaseLoading}
                    onClick={() => handlePurchase(pkg.id)}
                  >
                    {purchaseLoading === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Started'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
           <Card className="w-full max-w-md border-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 bg-background">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b p-8 text-center text-zinc-900 dark:text-zinc-100">
                 <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6 border border-destructive/20">
                    <Trash2 size={32} />
                 </div>
                 <CardTitle className="text-2xl font-black tracking-tighter italic uppercase text-zinc-900 dark:text-zinc-100">Archive Resume?</CardTitle>
                 <CardDescription className="font-medium text-destructive mt-2">This action is permanent and cannot be reversed.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex gap-4 bg-background">
                 <Button variant="outline" className="flex-1 font-bold border-2 h-12 text-zinc-900 dark:text-zinc-100" onClick={() => setDeleteConfirmId(null)} disabled={deleteLoading}>Cancel</Button>
                 <Button variant="destructive" className="flex-1 font-bold h-12 shadow-lg" onClick={confirmDelete} disabled={deleteLoading}>
                   {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />} Delete
                 </Button>
              </CardContent>
           </Card>
        </div>
      )}

      {/* Preview */}
      {viewingResume && (
        <div className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl h-full bg-background border-2 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="flex items-center justify-between p-6 px-10 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                     <FileText size={20} />
                  </div>
                  <h3 className="font-black text-xl italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">Preview Mode</h3>
               </div>
               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-background border-2 transition-all hover:scale-110" onClick={() => setViewingResume(null)}>
                 <X className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
               </Button>
            </div>
            <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 p-6 md:p-12 custom-scrollbar">
              <ResumePreview 
                resumeMarkdown={viewingResume.markdown || "# Generated"} 
                resumeData={viewingResume.data}
                onResumeChange={() => {}}
                className="shadow-2xl mx-auto rounded-lg overflow-hidden border-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter */}
      {clResumeId && (
        <div className="fixed inset-0 z-[130] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg shadow-2xl border-2 overflow-hidden bg-background">
            <CardHeader className="relative p-8 bg-zinc-50 dark:bg-zinc-900 border-b">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-background border-2" onClick={() => setClResumeId(null)}>
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl font-black tracking-tighter italic uppercase flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Sparkles size={24} className="text-primary" /> Cover Letter
              </CardTitle>
              <CardDescription className="font-medium">Tailor your pitch for a specific role.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <textarea
                value={clJd}
                onChange={e => setClJd(e.target.value)}
                className="w-full min-h-[200px] p-4 rounded-xl border-2 bg-muted/20 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium custom-scrollbar text-zinc-900 dark:text-zinc-100"
                placeholder="Paste the job description here..."
              />
              <Button onClick={handleGenerateCoverLetter} disabled={clLoading} className="w-full h-12 font-black uppercase tracking-widest shadow-lg">
                {clLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cover Letter Result */}
      {clResult && (
        <div className="fixed inset-0 z-[140] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl h-[80vh] shadow-2xl border-2 overflow-hidden bg-background flex flex-col">
            <CardHeader className="relative p-8 bg-zinc-50 dark:bg-zinc-900 border-b flex-shrink-0">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-background border-2" onClick={() => { setClResult(null); setClCopied(false); }}>
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl font-black tracking-tighter italic uppercase flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Sparkles size={24} className="text-primary" /> Generated!
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-10 font-medium leading-relaxed text-zinc-800 dark:text-zinc-200 custom-scrollbar whitespace-pre-wrap">
              {clResult}
            </CardContent>
            <div className="p-8 border-t bg-zinc-50/50 dark:bg-zinc-900/50 flex-shrink-0">
              <Button onClick={() => { navigator.clipboard.writeText(clResult); setClCopied(true); setTimeout(() => setClCopied(false), 2000); }} className="w-full h-14 font-black uppercase tracking-widest shadow-xl">
                {clCopied ? <><Check className="mr-2 h-5 w-5" /> Copied!</> : <><Copy className="mr-2 h-5 w-5" /> Copy Pitch</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
