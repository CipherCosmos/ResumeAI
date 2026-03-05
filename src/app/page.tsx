'use client';

import React, { useState } from 'react';
import ResumeForm, { ResumeData } from '@/components/ResumeForm';
import ResumePreview from '@/components/ResumePreview';
import styles from './page.module.css';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const [resumeMarkdown, setResumeMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateResume = async (data: ResumeData) => {
    setIsLoading(true);
    setError(null);
    setResumeMarkdown(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResumeMarkdown(result.resume);
      
      // Scroll to preview on mobile devices after generation
      if (window.innerWidth < 1024) {
         document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      
    } catch (err: any) {
      console.error('Failed to generate resume:', err);
      setError(err.message || 'An unexpected error occurred while generating the resume.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResumeMarkdown(null);
  };

  return (
    <div className={styles.pageContainer}>
      
      <header className={`${styles.header} animate-fade-in`}>
        <h1 className={styles.headerTitle}>AI Executive Resume Builder</h1>
        <p className={styles.headerSubtitle}>
          Craft an ATS-optimized, high-impact resume in seconds using advanced AI models. 
          Fill out your details below and stand out from the crowd.
        </p>
      </header>

      {error && (
        <div className={`${styles.errorMessage} animate-fade-in`}>
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <main className={styles.mainLayout}>
        {/* Form Section */}
        <div className={`${styles.formSection} delay-100`}>
          <ResumeForm onSubmit={handleGenerateResume} isLoading={isLoading} />
        </div>

        {/* Preview Section */}
        <div id="preview-section" className={`${styles.previewSection} delay-200`}>
          <ResumePreview resumeMarkdown={resumeMarkdown} onReset={handleReset} />
        </div>
      </main>

      <footer className={`${styles.footer} animate-fade-in delay-300`}>
        <p>© {new Date().getFullYear()} AI Resume Generator. All rights reserved.</p>
      </footer>
    </div>
  );
}
