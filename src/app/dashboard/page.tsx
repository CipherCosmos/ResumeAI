'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Clock, Trash2, Coins, ArrowRight, Loader2, Plus, X, Eye, Share2, Sparkles, Copy, Check } from 'lucide-react';
import ResumePreview from '@/components/ResumePreview';
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
    </Suspense>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams?.get('purchase') === 'true') {
      setShowPricing(true);
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Resume viewing modal state
  const [viewingResume, setViewingResume] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cover letter modal state
  const [clResumeId, setClResumeId] = useState<string | null>(null);
  const [clJd, setClJd] = useState('');
  const [clLoading, setClLoading] = useState(false);
  const [clResult, setClResult] = useState<string | null>(null);
  const [clCopied, setClCopied] = useState(false);

  // Billing states
  const [showPricing, setShowPricing] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setPurchaseLoading(packageId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else alert(error || 'Failed to start checkout');
    } catch {
      alert('Network error');
    } finally {
      setPurchaseLoading(null);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resumeRes, creditRes] = await Promise.all([
        fetch('/api/resumes'),
        fetch('/api/credits'),
      ]);
      if (resumeRes.ok) {
        const data = await resumeRes.json();
        setResumes(data.resumes || []);
      }
      if (creditRes.ok) {
        const data = await creditRes.json();
        setCredits(data.balance || 0);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        setResumes(prev => prev.filter(r => r.id !== deleteConfirmId));
        setDeleteConfirmId(null);
      } else {
        alert('Failed to delete resume.');
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      alert('Error deleting resume.');
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
        
        if (resume?.data && typeof resume.data === 'object' && resume.data.personal) {
          setViewingResume({ type: 'json', data: resume.data, markdown: resume.markdown });
        } else if (resume?.markdown && resume.markdown !== '# Generated') {
          setViewingResume({ type: 'markdown', markdown: resume.markdown });
        } else if (resume?.data) {
          setViewingResume({ type: 'json', data: resume.data, markdown: resume.markdown });
        } else {
          alert('This resume is empty or was saved incorrectly.');
        }
      } else {
        alert('Failed to load resume.');
      }
    } catch {
      alert('Error loading resume.');
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
        fetchData(); 
      } else {
        alert(data.error || 'Failed to generate cover letter.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setClLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Resumes</h1>
        <p className="text-muted-foreground text-lg">Manage your generated resumes and billing balance</p>
      </div>

      {/* Credit Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Billing Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{credits}</div>
            <p className="text-xs text-muted-foreground mt-1">AI tokens remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resumes Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total resumes generated</p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors shadow-lg group border-none" onClick={() => setShowPricing(true)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Add Credits</CardTitle>
            <Plus className="h-4 w-4" />
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-4rem)] justify-end">
            <p className="text-sm opacity-90 mb-4">Top up your AI balance to generate more resumes</p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              Get more <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl">
            <CardHeader className="relative">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setShowPricing(false)}>
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl font-bold text-center">Top Up AI Credits</CardTitle>
              <CardDescription className="text-center">Choose a bundle to continue building with AI</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
              {[
                { id: 'starter', name: 'Starter', tokens: 50, price: '$5', desc: 'Perfect for one job' },
                { id: 'professional', name: 'Pro', tokens: 200, price: '$15', desc: 'For active seekers', featured: true },
                { id: 'elite', name: 'Elite', tokens: 500, price: '$30', desc: 'Max value' },
              ].map(pkg => (
                <div 
                  key={pkg.id} 
                  className={`relative flex flex-col p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${pkg.featured ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  {pkg.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Most Popular</span>}
                  <h4 className="font-bold text-lg mb-1">{pkg.name}</h4>
                  <div className="text-2xl font-bold mb-1">{pkg.price}</div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-4">
                    <Coins size={12} /> {pkg.tokens} AI Tokens
                  </div>
                  <p className="text-xs text-muted-foreground mb-6 h-8">{pkg.desc}</p>
                  <Button 
                    className="w-full" 
                    variant={pkg.featured ? 'default' : 'outline'}
                    disabled={purchaseLoading === pkg.id}
                    onClick={() => handlePurchase(pkg.id)}
                  >
                    {purchaseLoading === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy Now'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resume History */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 tracking-tight">Resume History</h2>
        {resumes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No resumes yet</h3>
            <p className="text-muted-foreground mb-6">Create your first resume to see it here.</p>
            <Button onClick={() => router.push('/builder')}>Create Resume <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map(resume => (
              <Card key={resume.id} className="cursor-pointer hover:border-primary transition-colors flex flex-col group" onClick={(e) => handleViewResume(resume.id, e)}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center justify-center p-3 bg-primary/10 text-primary rounded-lg transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {modalLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-1 group flex justify-between items-center">
                    {resume.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="h-3.5 w-3.5" /> 
                    {new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="secondary" size="sm" className="h-8 flex-1 text-xs" onClick={(e) => { e.stopPropagation(); const url = `${window.location.origin}/r/${resume.id}`; navigator.clipboard.writeText(url); setCopiedId(resume.id); setTimeout(() => setCopiedId(null), 2000); }}>
                      <Share2 className="h-3.5 w-3.5 mr-1.5" /> {copiedId === resume.id ? 'Copied!' : 'Share'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 flex-1 text-xs text-accent border-accent/20 bg-accent/5 hover:bg-accent/10" onClick={(e) => { e.stopPropagation(); setClResumeId(resume.id); setClJd(''); }}>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Cover Letter
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={(e) => handleDelete(resume.id, e)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="text-2xl font-bold mb-6 tracking-tight">Billing Data</h2>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions yet.</p>
        ) : (
          <Card>
            <div className="divide-y">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 px-6 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{tx.description}</span>
                    <span className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-semibold ${tx.amount > 0 ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Fullscreen Resume Modal */}
      {viewingResume && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[90vh] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden relative drop-shadow-2xl">
            <Button variant="outline" size="icon" className="absolute top-4 right-4 z-10 bg-background/50 hover:bg-background border-zinc-200" onClick={() => setViewingResume(null)}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 p-2 md:p-6 custom-scrollbar">
              <ResumePreview 
                resumeMarkdown={viewingResume.type === 'markdown' ? viewingResume.markdown : "Loaded"} 
                resumeData={viewingResume.type === 'json' ? viewingResume.data : undefined}
                onResumeChange={() => {}}
                onReset={() => setViewingResume(null)}
                jobDescription={""}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter JD Input Modal */}
      {clResumeId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="relative">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setClResumeId(null)}>
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Sparkles className="h-5 w-5" /> Generate Cover Letter
              </CardTitle>
              <CardDescription>
                Paste a job description below to generate a tailored cover letter based on your saved resume.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={clJd}
                onChange={e => setClJd(e.target.value)}
                className="w-full min-h-[200px] p-3 rounded-md border bg-transparent text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Paste the job description here (optional)..."
              />
              <Button onClick={handleGenerateCoverLetter} disabled={clLoading} className="w-full">
                {clLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate (2 credits)</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cover Letter Result Modal */}
      {clResult && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <CardHeader className="relative shrink-0 border-b bg-muted/30">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => { setClResult(null); setClCopied(false); }}>
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Sparkles className="h-5 w-5" /> Your Cover Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              <textarea
                value={clResult}
                onChange={e => setClResult(e.target.value)}
                className="w-full h-full min-h-[300px] p-0 border-none bg-transparent resize-none text-sm leading-relaxed focus:outline-none"
              />
            </CardContent>
            <div className="p-4 border-t bg-muted/30 shrink-0">
              <Button onClick={() => { navigator.clipboard.writeText(clResult); setClCopied(true); setTimeout(() => setClCopied(false), 2000); }} className="w-full">
                {clCopied ? <><Check className="mr-2 h-4 w-4" /> Copied!</> : <><Copy className="mr-2 h-4 w-4" /> Copy to Clipboard</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <CardTitle>Delete Resume</CardTitle>
              <CardDescription>
                Are you sure you want to delete this resume? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
