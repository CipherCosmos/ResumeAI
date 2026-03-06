'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary Caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-xl border shadow-sm">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
              <p className="text-muted-foreground">
                A critical application error occurred. We've been notified and are looking into it.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Button onClick={() => reset()} className="w-full">
                Try again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                Go back home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
