'use client';

import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/auth')) return null;

  return (
    <footer className="w-full border-t bg-background/50 py-8 backdrop-blur">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-8">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles size={16} />
          <span className="font-semibold tracking-tight">ResumeAI</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ResumeAI — Build ATS-optimized resumes with AI
        </p>

        <div className="flex items-center gap-2 lg:gap-4 text-sm font-medium text-muted-foreground">
          <span>2 credits = 1 resume</span>
          <span className="opacity-50">·</span>
          <span>1 credit = 1 parse or ATS score</span>
        </div>
      </div>
    </footer>
  );
}
