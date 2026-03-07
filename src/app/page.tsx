'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sparkles, FileText, Target, Zap, ChevronRight, CheckCircle2,
  Upload, Briefcase, GraduationCap, Code, MessageCircle,
  BarChart3, Bot, ArrowRight, ClipboardList, Globe, ShieldCheck,
  MousePointer2, Stars, Cpu, Layers, User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMousePosition } from '@/hooks/useMousePosition';
import { GeometricBackground } from '@/components/GeometricBackground';

export default function LandingPage() {
  const { status } = useSession();
  const mouse = useMousePosition();
  const heroRef = useRef<HTMLDivElement>(null);
  
  const ctaHref = status === 'authenticated' ? '/builder' : '/auth/signin';
  const ctaLabel = status === 'authenticated' ? 'Go to Dashboard' : 'Start Building for Free';

  // Calculate spotlight position relative to hero section
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      setSpotlightPos({
        x: mouse.x - rect.left,
        y: mouse.y - rect.top
      });
    }
  }, [mouse]);

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Hero Section - Enhanced with Geometric Interaction */}
      <section ref={heroRef} className="relative px-6 pt-32 pb-32 md:pt-48 md:pb-56 overflow-hidden">
        {/* Interactive Geometric Background */}
        <GeometricBackground />

        {/* CSS Spotlight for extra depth */}
        <div 
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 opacity-0 md:opacity-100"
          style={{
            background: `radial-gradient(800px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(var(--primary-rgb), 0.05), transparent 80%)`
          }}
        />
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.03),rgba(255,255,255,0))]" />
        
        <div className="container relative z-10 mx-auto text-center max-w-5xl">
          <div className="group inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-6 py-2 text-sm font-black tracking-[0.1em] uppercase text-primary mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 hover:bg-primary/10 transition-all cursor-default border-2 shadow-sm">
            <Sparkles className="w-4 h-4 mr-3 animate-pulse" /> 
            Engineering Career Success
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.9] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200 uppercase italic">
            Precision <br className="hidden md:block" />
            <span className="text-transparent border-t-4 border-b-4 border-primary py-2 px-4 bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary bg-[length:200%_auto] animate-gradient not-italic">
              AI Powered
            </span>
          </h1>
          
          <p className="text-xl md:text-3xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed font-bold tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 opacity-80">
            Unleash the next generation of resume engineering. High-performance ATS optimization for elite professionals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Link href={ctaHref} className="relative group w-full sm:w-auto">
              <Button size="lg" className="h-20 px-16 text-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] group-hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.6)] group-hover:scale-105 transition-all duration-300 rounded-none skew-x-[-12deg]">
                <span className="skew-x-[12deg] flex items-center">{ctaLabel} <ChevronRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" /></span>
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-20 px-16 text-xl border-2 border-white/10 hover:bg-white/5 transition-all duration-300 font-black uppercase tracking-widest rounded-none skew-x-[-12deg]">
                <span className="skew-x-[12deg]">Protocol Brief</span>
              </Button>
            </Link>
          </div>

          <div className="mt-32 flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-30 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-700 animate-in fade-in duration-1000 delay-700">
             <div className="flex flex-col items-center gap-1">
                <span className="font-black text-3xl tracking-tighter">10K+</span>
                <span className="text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-60">Deployments</span>
             </div>
             <div className="h-12 w-px bg-white/10 hidden md:block" />
             <div className="flex flex-col items-center gap-1">
                <span className="font-black text-3xl tracking-tighter italic">ATS++</span>
                <span className="text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-60">Optimization</span>
             </div>
             <div className="h-12 w-px bg-white/10 hidden md:block" />
             <div className="flex flex-col items-center gap-1">
                <span className="font-black text-3xl tracking-tighter underline underline-offset-8 decoration-primary">XYZ+</span>
                <span className="text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-60">Compliance</span>
             </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid - Same as before but with slightly refined visuals */}
      <section id="features" className="py-32 bg-zinc-50/50 dark:bg-zinc-950/50 border-y relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-none italic uppercase">The Stack.<br/><span className="text-primary not-italic">Elite Tools.</span></h2>
              <p className="text-muted-foreground text-xl font-medium max-w-lg leading-relaxed">Engineered for maximum career impact and minimal operational friction.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Primary Bento: Resume Builder */}
            <Card className="md:col-span-8 bg-background/60 backdrop-blur-xl border-2 shadow-sm group overflow-hidden relative min-h-[450px] transition-all duration-500 hover:shadow-2xl hover:border-primary/50">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-3xl -mr-20 -mt-20 group-hover:bg-primary/25 transition-all duration-700" />
              <CardHeader className="p-10 relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mb-8 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg border border-primary/20">
                  <FileText className="w-8 h-8" />
                </div>
                <CardTitle className="text-4xl font-black tracking-tight mb-4">Neural Builder</CardTitle>
                <CardDescription className="text-xl text-foreground font-medium mt-6 leading-relaxed max-w-sm opacity-80">
                  High-performance workflow guiding you from zero to terminal-ready in minutes.
                </CardDescription>
              </CardHeader>
              <div className="absolute bottom-6 left-10 flex flex-wrap gap-4 relative z-10">
                {["PDF Extraction", "Live Thermal Preview", "Strategic AI"].map((tag) => (
                  <span key={tag} className="bg-muted/50 backdrop-blur px-5 py-2 rounded-xl text-[0.7rem] font-black uppercase tracking-widest border-2 opacity-60 hover:opacity-100 hover:border-primary transition-all cursor-default">{tag}</span>
                ))}
              </div>
            </Card>

            {/* Bento: Chatbot */}
            <Card className="md:col-span-4 bg-zinc-900 text-zinc-50 dark:bg-zinc-800 border-none group relative overflow-hidden min-h-[450px] transition-all duration-500 hover:scale-[1.02] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="p-10 relative z-10 h-full flex flex-col">
                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-8 text-zinc-50 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 border border-white/20">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tight mb-4">AI Link</CardTitle>
                <CardDescription className="text-zinc-400 text-lg font-medium flex-1 leading-relaxed">
                  Conversational intelligence that reconstructs your career history into a data-driven narrative.
                </CardDescription>
                <Button variant="secondary" className="mt-10 font-black w-full uppercase tracking-widest text-[0.75rem] h-14 shadow-xl hover:bg-primary hover:text-white transition-all border-none">
                  Open Sub-Link
                </Button>
              </CardHeader>
            </Card>

            {/* Bento: ATS Tracker */}
            <Card className="md:col-span-5 border-2 shadow-sm group hover:border-emerald-500/50 hover:shadow-2xl transition-all duration-500 relative min-h-[400px] bg-background/60 backdrop-blur-xl">
               <CardHeader className="p-10">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center mb-8 text-emerald-500 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-md border border-emerald-500/20">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tight mb-4">Audit Terminal</CardTitle>
                <CardDescription className="text-lg text-foreground/70 mt-4 leading-relaxed font-medium">
                  Deep structural audit using modern ATS algorithms. Zero false positives.
                </CardDescription>
              </CardHeader>
              <div className="mt-auto px-10 pb-10 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-5xl italic tracking-tighter">98.4% <span className="text-xs uppercase not-italic tracking-widest opacity-50 ml-3">Structural Fidelity</span></div>
            </Card>

            {/* Bento: Cover Letter */}
            <Card className="md:col-span-7 border-2 shadow-sm group hover:border-amber-500/50 hover:shadow-2xl transition-all duration-500 relative min-h-[400px] bg-background/60 backdrop-blur-xl">
               <CardHeader className="p-10">
                <div className="w-16 h-16 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center mb-8 text-amber-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md border border-amber-500/20">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tight mb-4">Tailored Fragments</CardTitle>
                <CardDescription className="text-lg text-foreground/70 mt-4 leading-relaxed font-medium max-w-md">
                  Modular generation of cover letters that perfectly fit into the target organization's cultural stack.
                </CardDescription>
              </CardHeader>
              <div className="absolute right-0 bottom-0 p-10 flex flex-col items-end opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
                 <Cpu size={140} className="text-amber-600" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The 6-Step Process Timeline */}
      <section className="py-40 relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.2),transparent)] opacity-40" />
        <div className="container relative z-10 mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-32">
            <h2 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter uppercase italic leading-none opacity-20">The Deployment</h2>
            <p className="text-zinc-400 text-2xl font-bold tracking-tight">Optimized Pipeline Flow.</p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 hidden lg:block -translate-y-1/2 rounded-full overflow-hidden">
               <div className="h-full bg-primary w-0 group-hover:w-full transition-all duration-1000" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16 lg:gap-8 relative z-10">
              {[
                { icon: Upload, title: "Initialize", step: "01" },
                { icon: UserIcon, title: "Core", step: "02" },
                { icon: Target, title: "Directives", step: "03" },
                { icon: Zap, title: "Assets", step: "04" },
                { icon: Layers, title: "Projects", step: "05" },
                { icon: Stars, title: "Finalize", step: "06" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div className="text-[0.65rem] font-black tracking-[0.6em] mb-8 opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all uppercase">SEC_{item.step}</div>
                  <div className="w-28 h-28 rounded-none skew-x-[-15deg] bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center mb-10 shadow-2xl group-hover:bg-primary group-hover:border-primary transition-all duration-500 relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-none blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <item.icon className="w-10 h-10 relative z-10 text-zinc-500 group-hover:text-white transition-colors skew-x-[15deg]" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-[0.2em] italic group-hover:text-primary transition-colors">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Pay-As-You-Go with Professional Aesthetics */}
      <section className="py-40 border-t bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-5xl mx-auto mb-32">
            <h2 className="text-7xl md:text-[10rem] font-black mb-12 tracking-tighter leading-none uppercase italic opacity-10">Unit Costing</h2>
            <h3 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter leading-none uppercase -mt-24 relative z-10">Fair. Simple. <br/><span className="text-primary italic">One-Time.</span></h3>
            <p className="text-muted-foreground text-2xl font-bold tracking-tight opacity-70">No persistent subscriptions. Only results.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-5xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="p-16 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-all hover:-translate-y-2 duration-500 border-t-8 border-zinc-300 dark:border-zinc-700">
              <span className="text-[0.7rem] font-black tracking-[0.5em] uppercase opacity-30 block mb-12 border-b-2 pb-6 border-zinc-100 dark:border-white/5">STANDARD PROTOCOL</span>
              <h3 className="text-5xl font-black mb-6 tracking-tighter italic uppercase">CORE</h3>
              <div className="text-8xl font-black mb-16 tracking-tighter opacity-80">$0</div>
              <ul className="space-y-8 mb-20 flex-1">
                {["10 AI Credits Units", "5 Direct Exports", "Core Career Engine", "Standard Pipeline Support"].map((f, i) => (
                  <li key={i} className="flex items-center text-lg font-black text-zinc-500"><div className="w-2 h-2 bg-primary mr-5" /> {f}</li>
                ))}
              </ul>
              <Link href="/auth/signin" className="w-full">
                <Button variant="outline" className="w-full h-20 bg-transparent border-2 border-zinc-900 dark:border-white/10 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase tracking-[0.3em] text-[0.8rem] transition-all">
                  Initialize Pilot
                </Button>
              </Link>
            </div>

            {/* Pro Tier - Featured */}
            <div className="p-16 bg-zinc-900 text-zinc-50 relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] flex flex-col transition-all hover:-translate-y-2 duration-500 border-t-8 border-primary">
              <div className="absolute top-0 right-0 p-12">
                <Stars className="w-24 h-24 text-primary opacity-20 animate-pulse" />
              </div>
              <span className="text-[0.7rem] font-black tracking-[0.5em] uppercase text-primary block mb-12 border-b-2 border-primary/20 pb-6">HIGH-SPEED ACCESS</span>
              <h3 className="text-5xl font-black mb-6 tracking-tighter italic uppercase">ELITE</h3>
              <div className="text-8xl font-black mb-4 tracking-tighter">$5</div>
              <div className="text-xs font-black text-primary mb-16 tracking-[0.4em] uppercase">One-Time Tactical Deployment</div>
              <ul className="space-y-8 mb-20 flex-1">
                {["50 High-Res AI Credits", "Permanent Cloud Sync", "Unlimited Structural Audits", "Full Engine Unlocked"].map((f, i) => (
                  <li key={i} className="flex items-center text-lg font-black"><div className="w-2 h-2 bg-primary mr-5 shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" /> {f}</li>
                ))}
              </ul>
              <Link href={ctaHref} className="w-full">
                <Button className="w-full h-20 text-sm font-black uppercase tracking-[0.3em] shadow-2xl bg-primary hover:bg-primary/90 transition-all border-none">
                  Activate Protocol
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Professional & Branded */}
      <footer className="py-24 border-t bg-background relative overflow-hidden">
         <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-20">
               <div className="col-span-1 md:col-span-2 space-y-10">
                  <div className="flex items-center gap-4 text-3xl font-black italic tracking-tighter uppercase group cursor-default">
                    <div className="w-12 h-12 bg-primary rounded-none skew-x-[-12deg] flex items-center justify-center text-white transition-transform overflow-hidden shadow-lg">
                       <div className="skew-x-[12deg]"><Sparkles size={24} /></div>
                    </div>
                    Resume<span className="text-primary italic">AI</span>
                  </div>
                  <p className="max-w-md text-zinc-500 font-bold text-xl leading-relaxed">
                    Engineering the future of professional identities. Data-driven strategy for elite global careers.
                  </p>
               </div>
               <div className="space-y-8">
                  <h4 className="font-black uppercase tracking-[0.4em] text-[0.7rem] opacity-30">Operational</h4>
                  <ul className="space-y-5 text-sm font-black text-zinc-400 uppercase tracking-widest">
                     <li><Link href="/builder" className="hover:text-primary transition-colors">Initialize Builder</Link></li>
                     <li><Link href="/dashboard" className="hover:text-primary transition-colors">Access Dashboard</Link></li>
                     <li><Link href="/ats-tracker" className="hover:text-primary transition-colors">Structural Audit</Link></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="font-black uppercase tracking-[0.4em] text-[0.7rem] opacity-30">Network</h4>
                  <ul className="space-y-5 text-sm font-black text-zinc-400 uppercase tracking-widest">
                     <li><a href="#" className="hover:text-primary transition-colors">LinkedIn Portal</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">X Architecture</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Meta Link</a></li>
                  </ul>
               </div>
            </div>
            <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[0.65rem] font-black tracking-[0.4em] uppercase opacity-20">
               <p>© 2026 RESUMEAI LABORATORIES. DEPLOYED WITH PRECISION.</p>
               <div className="flex gap-12">
                  <a href="#" className="hover:text-primary transition-colors">Privacy Prot</a>
                  <a href="#" className="hover:text-primary transition-colors">Terms of Ops</a>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
