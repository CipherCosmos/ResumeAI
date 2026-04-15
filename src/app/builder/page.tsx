'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ResumeForm from '@/components/ResumeForm';

const ResumePreview = dynamic(() => import('@/components/ResumePreview'), {
  loading: () => <div className="flex h-full min-h-[500px] items-center justify-center bg-card rounded-xl border border-dashed"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" /> <span className="text-muted-foreground text-sm font-medium">Loading Preview Engine...</span></div>,
  ssr: false
});
import { ResumeData } from '@/types/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { AlertCircle, Loader2 } from 'lucide-react';

function BuilderContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumeMarkdown, setResumeMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastJD = useRef<string>('');
  
  const resumeId = searchParams?.get('id');

  // Load existing resume data if ID is present
  useEffect(() => {
    if (status === 'authenticated' && resumeId) {
      const fetchResume = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/resumes?id=${resumeId}`);
          if (res.ok) {
            const responseData = await res.json();
            if (responseData.resume) {
              const { data, id, markdown } = responseData.resume;
              useResumeStore.getState().setResumeData(data);
              useResumeStore.getState().setCurrentResumeId(id);
              if (markdown) setResumeMarkdown(markdown);
              else setResumeMarkdown('Loaded'); // Trigger preview even if no markdown yet
            }
          }
        } catch (err) {
          console.error("Failed to fetch resume:", err);
          setError("Failed to load existing resume data.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchResume();
    }
  }, [resumeId, status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  const handleGenerateResume = async (data: ResumeData) => {
    setIsLoading(true);
    setError(null);
    setResumeMarkdown(null);
    lastJD.current = data.jobDescription || '';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      // The new API returns perfectly tailored JSON ResumeData
      if (responseData.data) {
        useResumeStore.getState().setResumeData(responseData.data);
      }
      if (responseData.resumeId) {
        useResumeStore.getState().setCurrentResumeId(responseData.resumeId);
      }
      
      setResumeMarkdown('# Generated'); // Set a truthy value to trigger the preview pane

      if (window.innerWidth < 1024) {
        setTimeout(() => {
          document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      console.error('Failed to generate resume:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasResume = resumeMarkdown !== null;

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto transition-all duration-500 w-full min-h-screen">
      {error && (
        <div className="flex items-center gap-3 p-4 text-sm font-bold text-destructive bg-destructive/10 border-2 border-destructive/20 rounded-2xl max-w-4xl mx-auto mb-8 animate-in slide-in-from-top-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1 uppercase tracking-tight">{error}</p>
          <button onClick={() => setError(null)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-destructive/10 transition-colors">&times;</button>
        </div>
      )}

      <main className={`grid gap-8 items-start transition-all duration-700 ease-in-out ${hasResume ? 'grid-cols-1 xl:grid-cols-[1fr_1.2fr] xl:gap-16 w-full' : 'grid-cols-1 max-w-5xl mx-auto pt-12'}`}>
        <div className={`order-1 transition-all duration-500 ${hasResume ? 'sticky top-24' : ''}`}>
          <div className="rounded-[2.5rem] border-2 bg-background shadow-2xl overflow-hidden">
            <ResumeForm onSubmit={handleGenerateResume} isLoading={isLoading} />
          </div>
          
          {hasResume && (
            <div className="mt-8 flex justify-center opacity-40 hover:opacity-100 transition-opacity">
               <div className="px-6 py-3 bg-zinc-900 text-zinc-400 rounded-full border border-white/5 font-black text-[0.6rem] uppercase tracking-[0.3em] flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
               </div>
            </div>
          )}
        </div>
        
        <div id="preview-section" className={`order-2 transition-all duration-700 ${hasResume ? 'xl:sticky xl:top-24 block' : 'hidden'}`}>
          <div className="group relative">
            {/* Perspective Shadow */}
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-none -z-10 group-hover:bg-primary/10 transition-all duration-1000" />
            
            <ResumePreview
              resumeMarkdown={resumeMarkdown || ''}
              onResumeChange={setResumeMarkdown}
              onReset={() => setResumeMarkdown(null)}
              jobDescription={lastJD.current}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
