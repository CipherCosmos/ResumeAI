'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ResumeForm from '@/components/ResumeForm';

const ResumePreview = dynamic(() => import('@/components/ResumePreview'), {
  loading: () => <div className="flex h-full min-h-[500px] items-center justify-center bg-card rounded-xl border border-dashed"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" /> <span className="text-muted-foreground text-sm font-medium">Loading Preview Engine...</span></div>,
  ssr: false
});
import { ResumeData } from '@/types/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resumeMarkdown, setResumeMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastJD = useRef<string>('');

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
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
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 max-w-[1600px] mx-auto transition-all duration-500">
      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg max-w-3xl mx-auto mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-destructive hover:opacity-70">&times;</button>
        </div>
      )}

      <main className={`grid gap-6 md:gap-8 items-start transition-all duration-400 ease-in-out ${hasResume ? 'grid-cols-1 xl:grid-cols-2 xl:gap-12 w-full' : 'grid-cols-1 max-w-5xl mx-auto'}`}>
        <div className="order-1 rounded-xl border bg-card shadow-sm">
          <ResumeForm onSubmit={handleGenerateResume} isLoading={isLoading} />
        </div>
        
        <div id="preview-section" className={`order-2 ${hasResume ? 'lg:sticky lg:top-24 block' : 'hidden'}`}>
          <ResumePreview
            resumeMarkdown={resumeMarkdown || ''}
            onResumeChange={setResumeMarkdown}
            onReset={() => setResumeMarkdown(null)}
            jobDescription={lastJD.current}
          />
        </div>
      </main>
    </div>
  );
}
