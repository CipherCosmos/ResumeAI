'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function JobCardSkeleton() {
    return (
        <Card className="relative bg-zinc-950/40 border-white/5 backdrop-blur-xl rounded-2xl p-6 overflow-hidden">
            <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 w-full">
                    {/* Icon Skeleton */}
                    <div className="h-14 w-14 rounded-xl bg-zinc-900 border border-white/10 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                    
                    <div className="space-y-3 w-full max-w-[300px]">
                        {/* Title Skeleton */}
                        <div className="h-6 w-3/4 bg-zinc-900 rounded-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        </div>
                        {/* Company Skeleton */}
                        <div className="h-4 w-1/2 bg-zinc-900 rounded-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                </div>
                
                {/* Buttons Skeleton */}
                <div className="flex gap-2">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                    <div className="h-10 w-24 rounded-xl bg-zinc-900 border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                </div>
            </div>

            {/* Grid Stats Skeleton */}
            <div className="grid grid-cols-3 gap-4 mt-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        </div>
                        <div className="h-3 w-16 bg-zinc-900 rounded relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Skills Skeleton */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-20 bg-zinc-900 rounded-lg border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                ))}
            </div>
        </Card>
    );
}
