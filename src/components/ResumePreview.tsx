'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, RefreshCw, FileText } from 'lucide-react';

interface ResumePreviewProps {
  resumeMarkdown: string | null;
  onReset: () => void;
}

export default function ResumePreview({ resumeMarkdown, onReset }: ResumePreviewProps) {
  
  const handleDownloadMarkdown = () => {
    if (!resumeMarkdown) return;
    const blob = new Blob([resumeMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!resumeMarkdown) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <FileText size={48} color="var(--primary)" />
        </div>
        <h3 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Your Resume Awaits</h3>
        <p style={{ color: 'var(--foreground)', opacity: 0.7, maxWidth: '400px' }}>
          Fill out the professional details form and click generate. Our AI will craft an ATS-optimized executive resume tailored for your target role.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '800px' }}>
      
      {/* Header Actions */}
      <div style={{ 
        padding: '1.5rem', 
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.3)'
      }}>
        <h3 className="heading-lg" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--primary)" />
          Generated Resume
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onReset}
            className="btn-primary" 
            style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', boxShadow: 'none' }}
          >
            <RefreshCw size={16} />
            Edit Info
          </button>
          <button onClick={handleDownloadMarkdown} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <Download size={16} />
            Save Markdown
          </button>
        </div>
      </div>

      {/* Markdown Content Area */}
      <div style={{ 
        padding: '2rem', 
        overflowY: 'auto',
        flex: 1,
        background: 'var(--background)'
      }}>
        <div className="prose prose-sm md:prose-base dark:prose-invert" style={{
           fontFamily: 'Arial, Helvetica, sans-serif',
           color: 'var(--foreground)',
           maxWidth: '100%',
           lineHeight: '1.5'
        }}>
           <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 style={{ fontSize: '2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--foreground)' }} {...props} />,
                h3: ({node, ...props}) => <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} {...props} />,
                p: ({node, ...props}) => <p style={{ marginBottom: '1rem' }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                strong: ({node, ...props}) => <strong style={{ fontWeight: '600', color: 'var(--foreground)' }} {...props} />,
              }}
           >
             {resumeMarkdown}
           </ReactMarkdown>
        </div>
      </div>
      
    </div>
  );
}
