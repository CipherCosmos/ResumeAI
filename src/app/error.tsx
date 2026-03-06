'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card/50 p-8 rounded-2xl border shadow-sm">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 ring-8 ring-background">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">Oops! Something went wrong</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We encountered an unexpected error while trying to render this section. 
            You can try refreshing or go back to the dashboard.
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} className="w-full sm:w-auto">
            Try again
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
