'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, SearchX, ChevronRight } from "lucide-react";
import { useMousePosition } from '@/hooks/useMousePosition';

export default function NotFound() {
  const mouse = useMousePosition();
  const containerRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setSpotlightPos({
        x: mouse.x - rect.left,
        y: mouse.y - rect.top
      });
    }
  }, [mouse]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Interactive Spotlight */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 opacity-20"
        style={{
          background: `radial-gradient(600px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(var(--primary-rgb), 0.2), transparent 80%)`
        }}
      />
      
      {/* Background Noise/Grain */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl px-6">
        <div className="relative w-32 h-32 mb-12 flex items-center justify-center rounded-[2.5rem] bg-primary/10 text-primary border-2 border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] animate-in zoom-in duration-700">
           <SearchX size={64} className="animate-pulse" />
           <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-950 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-black">404</div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Neural Path <span className="text-primary not-italic">Severed</span>
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          The requested coordinate does not exist in our database. It may have been relocated, deleted, or scrubbed from the system.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <Link href="/" className="flex-1">
            <Button className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
              <Sparkles size={18} /> Resume Laboratory
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full h-16 rounded-2xl bg-transparent border-2 border-white/10 hover:bg-white/5 text-zinc-100 font-black uppercase tracking-widest text-xs gap-3 transition-all active:scale-[0.98]">
              <ArrowLeft size={18} /> Central Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20 text-[0.65rem] font-black uppercase tracking-[0.5em] pointer-events-none">
        Protocol Error ID: 0x404_NOT_FOUND
      </div>
    </div>
  );
}
