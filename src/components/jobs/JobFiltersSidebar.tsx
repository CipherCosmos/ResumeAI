'use client';

import React from 'react';
import { 
    Filter, Briefcase, MapPin, TrendingUp, DollarSign, 
    X, Check, ChevronDown, Zap, Sparkles, Globe, 
    ShieldCheck, Heart, UserCheck, Languages
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

interface JobFiltersSidebarProps {
    filters: any;
    onFilterChange: (updates: any) => void;
    onApply: () => void;
}

const DISCIPLINES = [
    { id: 'Software', label: 'Software' },
    { id: 'Data', label: 'Data & AI' },
    { id: 'Design', label: 'Design' },
    { id: 'Product', label: 'Product' },
    { id: 'Operations', label: 'Ops' },
];

const LEVELS = [
    { id: 'Entry', label: 'Entry' },
    { id: 'Mid', label: 'Mid' },
    { id: 'Senior', label: 'Senior' },
    { id: 'Lead', label: 'Lead' },
    { id: 'Executive', label: 'Exec' },
];

const INDUSTRIES = [
    { id: 'Fintech', label: 'Fintech' },
    { id: 'Healthtech', label: 'Health' },
    { id: 'SaaS', label: 'SaaS' },
    { id: 'Web3', label: 'Web3' },
    { id: 'Ecommerce', label: 'Ecomm' },
];

const COMMITMENTS = [
    { id: 'full-time', label: 'Full-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'part-time', label: 'Part-time' },
];

export function JobFiltersSidebar({ filters, onFilterChange, onApply }: JobFiltersSidebarProps) {
    const toggleArrayFilter = (key: string, value: string) => {
        const current = filters[key] || [];
        const next = current.includes(value)
            ? current.filter((v: string) => v !== value)
            : [...current, value];
        onFilterChange({ [key]: next });
        onApply();
    };

    const resetFilters = () => {
        onFilterChange({
            level: [],
            type: [],
            discipline: [],
            industry: [],
            location: '',
            salaryMin: 0,
            visa: null,
            remote: null
        });
        onApply();
    };

    const hasActiveFilters = Object.entries(filters).some(([key, val]) => {
        if (Array.isArray(val)) return val.length > 0;
        if (key === 'salaryMin') return (val as number) > 0;
        if (key === 'search') return false; 
        return val !== null && val !== '';
    });

    return (
        <div className="w-full space-y-7 py-2 select-none">
            {/* Header with Counter */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
                        <SlidersHorizontal size={12} className="text-primary" />
                    </div>
                    <h3 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white">Engine Config</h3>
                </div>
                {hasActiveFilters && (
                    <button 
                        onClick={resetFilters}
                        className="text-[0.6rem] font-black text-primary hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                        <X size={10} /> Reset
                    </button>
                )}
            </div>

            {/* Multiselect Groups */}
            <div className="space-y-6">
                {/* Domain Group */}
                <FilterGroup 
                    label="Domain" 
                    icon={<Briefcase size={12} />} 
                    items={DISCIPLINES}
                    activeItems={filters.discipline}
                    onToggle={(id) => toggleArrayFilter('discipline', id)}
                />

                {/* Seniority Group */}
                <FilterGroup 
                    label="Seniority" 
                    icon={<TrendingUp size={12} />} 
                    items={LEVELS}
                    activeItems={filters.level}
                    onToggle={(id) => toggleArrayFilter('level', id)}
                />

                {/* Industry Group */}
                <FilterGroup 
                    label="Verticals" 
                    icon={<Globe size={12} />} 
                    items={INDUSTRIES}
                    activeItems={filters.industry}
                    onToggle={(id) => toggleArrayFilter('industry', id)}
                />
            </div>

            <Separator className="bg-white/5" />

            {/* Compensation Slider Placeholder / Quick Select */}
            <div className="space-y-3">
                <label className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-1">
                    <DollarSign size={12} /> Min Annual Comp
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                    {[60000, 100000, 140000, 180000, 220000, 260000].map((s) => (
                        <button
                            key={s}
                            onClick={() => {
                                onFilterChange({ salaryMin: filters.salaryMin === s ? 0 : s });
                                onApply();
                            }}
                            className={`px-1 py-2 rounded-lg border text-[0.6rem] font-black transition-all ${
                                filters.salaryMin === s
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                            }`}
                        >
                            ${s/1000}K+
                        </button>
                    ))}
                </div>
            </div>

            {/* Smart Discover Toggles */}
            <div className="space-y-2">
                <label className="text-[0.6rem] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Zap size={12} className="text-primary" /> Advanced Flags
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                    <ToggleFilter 
                        active={filters.remote === true}
                        label="Remote Only"
                        icon={<Globe size={12} />}
                        onToggle={() => {
                            onFilterChange({ remote: filters.remote === true ? null : true });
                            onApply();
                        }}
                    />
                    <ToggleFilter 
                        active={filters.visa === true}
                        label="Visa Sponsorship"
                        icon={<UserCheck size={12} />}
                        onToggle={() => {
                            onFilterChange({ visa: filters.visa === true ? null : true });
                            onApply();
                        }}
                    />
                    <ToggleFilter 
                        active={filters.type.includes('contract')}
                        label="Contract Work"
                        icon={<Briefcase size={12} />}
                        onToggle={() => toggleArrayFilter('type', 'contract')}
                    />
                </div>
            </div>

            {/* Neural System Status */}
            <div className="pt-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-black/40 to-black border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                        <Sparkles size={24} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[0.6rem] font-black text-primary uppercase tracking-widest">Discovery Core</span>
                    </div>
                    <p className="text-[0.55rem] text-zinc-500 font-bold leading-relaxed italic uppercase tracking-tighter">
                        "CALIBRATED FOR PEAK ALIGNMENT. DISCARDING SUB-OPTIMAL NODES."
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────

function FilterGroup({ label, icon, items, activeItems, onToggle }: { 
    label: string, 
    icon: React.ReactNode, 
    items: any[], 
    activeItems: string[], 
    onToggle: (id: string) => void 
}) {
    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[0.6rem] font-black text-zinc-500 uppercase tracking-widest px-1">
                {icon}
                <span>{label}</span>
                {activeItems.length > 0 && (
                    <Badge variant="secondary" className="ml-auto h-4 px-1 text-[0.55rem] font-black bg-primary/20 text-primary border-none">
                        {activeItems.length}
                    </Badge>
                )}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {items.map(item => {
                    const isActive = activeItems.includes(item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => onToggle(item.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[0.6rem] font-black transition-all border ${
                                isActive 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                                : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ToggleFilter({ active, label, icon, onToggle }: { active: boolean, label: string, icon: React.ReactNode, onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                active
                ? 'bg-primary/10 border-primary/40 text-white'
                : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/[0.07] hover:border-white/10'
            }`}
        >
            <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-primary text-white' : 'bg-black/40 text-zinc-600'}`}>
                    {icon}
                </div>
                <span className="text-[0.65rem] font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className={`h-4 w-4 rounded-md border-2 transition-all flex items-center justify-center ${
                active ? 'border-primary bg-primary' : 'border-zinc-800 bg-black/40'
            }`}>
                {active && <Check size={10} className="text-white" strokeWidth={4} />}
            </div>
        </button>
    );
}

import { SlidersHorizontal } from 'lucide-react';
