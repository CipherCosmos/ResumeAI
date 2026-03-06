'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sparkles, FileText, Target, Zap, ChevronRight, CheckCircle2,
  Upload, Briefcase, GraduationCap, Code, MessageCircle,
  BarChart3, Share2, Bot, ArrowRight, ClipboardList, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  const { status } = useSession();

  const ctaHref = status === 'authenticated' ? '/builder' : '/auth/signin';
  const ctaLabel = status === 'authenticated' ? 'Go to Builder' : 'Start Building for Free';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32 md:pt-36 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-200/40 via-background to-background dark:from-zinc-900/40" />
        <div className="container relative z-10 mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6 transition-colors">
            <Sparkles className="w-4 h-4 mr-2" /> 
            AI-Powered Career Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Your Entire Career Toolkit, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-300 dark:to-zinc-600">
              Powered by AI
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Build ATS-optimized resumes, generate tailored cover letters, track your ATS scores, and chat with an AI career counselor — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ctaHref}>
              <Button size="lg" className="h-12 px-8 text-base shadow-xl hover:scale-105 transition-transform">
                {ctaLabel} <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          {status !== 'authenticated' && (
            <p className="mt-4 text-sm text-muted-foreground/80">Includes 10 free AI credits. No credit card required.</p>
          )}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24 bg-zinc-50/50 dark:bg-zinc-950/50 border-y">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything You Need to Land the Job</h2>
            <p className="text-muted-foreground text-lg">Four powerful tools working together to maximize your chances.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-2" />
                <CardTitle>AI Resume Builder</CardTitle>
                <CardDescription className="text-base text-foreground/80 mt-2">
                  8-step intelligent builder with smart parsing. Upload an existing resume or start from scratch — AI handles the rest.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">PDF/DOCX Upload</span>
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">XYZ Bullets</span>
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">3 Templates</span>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-zinc-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <MessageCircle className="w-10 h-10 text-zinc-500 mb-2" />
                <CardTitle>AI Career Chatbot</CardTitle>
                <CardDescription className="text-base text-foreground/80 mt-2">
                  Not sure where to start? Chat with our AI counselor — it learns about you through conversation and builds your resume for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">Free Conversation</span>
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">1-Click Generate</span>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-emerald-500 mb-2" />
                <CardTitle>ATS Score Tracker</CardTitle>
                <CardDescription className="text-base text-foreground/80 mt-2">
                  Run unlimited analyses to see how your resume matches any job description. Track scores, find missing keywords, and improve.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">Score History</span>
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">Keyword Matching</span>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <ClipboardList className="w-10 h-10 text-amber-500 mb-2" />
                <CardTitle>Smart Cover Letters</CardTitle>
                <CardDescription className="text-base text-foreground/80 mt-2">
                  Generate tailored cover letters from any saved resume. Paste a new JD and get a perfectly customized letter in seconds.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">JD-Tailored</span>
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">Editable</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Step-by-Step Process */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">The 8-Step Intelligent Builder</h2>
            <p className="text-muted-foreground text-lg">Build a professional resume in minutes, not hours.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Upload, title: "1. Smart Parsing", desc: "Upload your old PDF/Word doc — AI instantly extracts all your data." },
              { icon: Briefcase, title: "2. Personal Info", desc: "Your contact details, LinkedIn, GitHub, and portfolio links." },
              { icon: Target, title: "3. Target Role & JD", desc: "Paste the job description — AI tailors everything to match it." },
              { icon: Code, title: "4. AI-Powered Skills", desc: "AI suggests skills from your target role and extracts keywords." },
              { icon: Zap, title: "5. XYZ Experience", desc: "AI rewrites weak bullets into high-impact Google XYZ formula." },
              { icon: Globe, title: "6. Projects", desc: "Showcase your best work with AI-enhanced descriptions." },
              { icon: GraduationCap, title: "7. Education", desc: "Degrees, coursework, GPA — organized for maximum impact." },
              { icon: Sparkles, title: "8. Review & Generate", desc: "AI summary, certifications, languages, template selection." }
            ].map((step, i) => (
              <Card key={i} className="bg-muted/30 border-none shadow-none hover:bg-muted/50 transition-colors">
                <CardHeader className="p-6">
                  <div className="w-12 h-12 bg-background rounded-xl border flex items-center justify-center mb-4 shadow-sm">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-sm mt-2">{step.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-zinc-900 text-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Pay-As-You-Go Pricing</h2>
            <p className="text-zinc-400 text-lg">No monthly subscriptions. Just buy AI tokens when you need them.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="bg-zinc-800/50 border-zinc-700 text-zinc-100 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl text-zinc-400">Trial</CardTitle>
                <div className="text-5xl font-extrabold mt-4 mb-2">$0</div>
                <CardDescription className="text-zinc-400">Everything to get started.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "10 Free AI Credits", "Up to 5 Resume Generations", "AI Career Chatbot (Unlimited)",
                    "ATS Score Analysis", "Public Resume Sharing", "3 ATS-Optimized Templates"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center text-sm"><CheckCircle2 className="w-5 h-5 mr-3 text-emerald-400" /> {feature}</li>
                  ))}
                </ul>
                <Link href="/auth/signin" className="w-full mt-auto block">
                  <Button variant="outline" className="w-full bg-transparent border-zinc-600 hover:bg-zinc-700 text-zinc-100">Create Free Account</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Most Popular
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Pro Tokens</CardTitle>
                <div className="text-5xl font-extrabold mt-4 mb-2">$5 <span className="text-lg font-medium text-muted-foreground">/ one-time</span></div>
                <CardDescription>For serious job seekers.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "50 AI Credits", "25+ Resume Generations", "Unlimited Cover Letters",
                    "Unlimited ATS Score Tracking", "XYZ Bullet Rewrites", "JD Keyword Extraction",
                    "Lifetime Access to All Resumes"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center text-sm"><CheckCircle2 className="w-5 h-5 mr-3 text-primary" /> {feature}</li>
                  ))}
                </ul>
                <Link href={ctaHref} className="w-full mt-auto block">
                  <Button className="w-full h-12 text-base">Get Started <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust / CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-4xl font-extrabold tracking-tight mb-6">Ready to Beat the ATS?</h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Join professionals using AI to build resumes that actually get past the algorithms. Chat with our AI counselor, build your resume, track your ATS score, and land more interviews.
          </p>
          <Link href={ctaHref}>
            <Button size="lg" className="h-14 px-10 text-lg shadow-xl hover:scale-105 transition-transform">
              {ctaLabel} <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
