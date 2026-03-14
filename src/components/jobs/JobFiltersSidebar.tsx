'use client';

import React from 'react';
import { 
    Filter, Briefcase, MapPin, TrendingUp, DollarSign, 
    X, Check, ChevronDown, Zap, Sparkles
} from 'lucide-react';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface JobFiltersSidebarProps {
    filters: any;
    onFilterChange: (updates: any) => void;
    onApply: () => void;
}

export function JobFiltersSidebar({ filters, onFilterChange, onApply }: JobFiltersSidebarProps) {
    const handleLevelChange = (val: string) => {
        onFilterChange({ level: val === 'all' ? '' : val });
        onApply();
    };

    const handleLocationChange = (val: string) => {
        onFilterChange({ location: val === 'all' ? '' : val });
        onApply();
    };

    const handleTypeChange = (val: string) => {
        onFilterChange({ type: val === 'all' ? '' : val });
        onApply();
    };

    return (
        <div className="w-full space-y-8 p-1">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Filters</h3>
                </div>
                {(filters.level || filters.location || filters.type) && (
                    <button 
                        onClick={() => {
                            onFilterChange({ level: '', location: '', type: '' });
                            onApply();
                        }}
                        className="text-[0.6rem] font-bold text-zinc-500 hover:text-white uppercase tracking-wider transition-colors"
                    >
                        Reset All
                    </button>
                )}
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
                <label className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} /> Seniority
                </label>
                <Select value={filters.level || 'all'} onValueChange={handleLevelChange}>
                    <SelectTrigger className="w-full bg-zinc-900/50 border-white/5 text-xs text-white h-11 rounded-xl focus:border-primary/50 transition-all">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="Entry">Entry Level</SelectItem>
                        <SelectItem value="Mid">Mid Level</SelectItem>
                        <SelectItem value="Senior">Senior Level</SelectItem>
                        <SelectItem value="Lead">Lead / Management</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Location Type */}
            <div className="space-y-3">
                <label className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> Workplace
                </label>
                <Select value={filters.location || 'all'} onValueChange={handleLocationChange}>
                    <SelectTrigger className="w-full bg-zinc-900/50 border-white/5 text-xs text-white h-11 rounded-xl focus:border-primary/50 transition-all">
                        <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="Remote">Fully Remote</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="USA">United States</SelectItem>
                        <SelectItem value="Europe">Europe</SelectItem>
                        <SelectItem value="Asia">Asia</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Employment Type */}
            <div className="space-y-3">
                <label className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={12} /> Commitment
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'full-time', label: 'Full-time' },
                        { id: 'contract', label: 'Contract' },
                        { id: 'part-time', label: 'Part-time' },
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => handleTypeChange(type.id)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[0.7rem] font-bold transition-all ${
                                filters.type === type.id
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                            }`}
                        >
                            {type.label}
                            {filters.type === type.id && <Check size={14} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Salary Range */}
            <div className="space-y-4">
                <label className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={12} /> Minimum Compensation
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { val: 0, label: 'Any' },
                        { val: 80000, label: '$80K+' },
                        { val: 120000, label: '$120K+' },
                        { val: 180000, label: '$180K+' },
                    ].map((s) => (
                        <button
                            key={s.val}
                            onClick={() => {
                                onFilterChange({ salaryMin: s.val });
                                onApply();
                            }}
                            className={`px-3 py-2 rounded-xl border text-[0.65rem] font-bold transition-all ${
                                filters.salaryMin === s.val
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                : 'bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Smart Filters */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={12} className="text-primary" /> Smart Discovery
                </label>
                <div className="space-y-2">
                    <button
                        onClick={() => {
                            const newLoc = filters.location === 'Remote' ? '' : 'Remote';
                            onFilterChange({ location: newLoc });
                            onApply();
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-[0.7rem] font-black uppercase tracking-widest transition-all ${
                            filters.location === 'Remote'
                            ? 'bg-primary/10 border-primary/50 text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]'
                            : 'bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-white/10'
                        }`}
                    >
                        <span>Remote Only</span>
                        <div className={`h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center ${
                            filters.location === 'Remote' ? 'border-primary bg-primary' : 'border-zinc-700'
                        }`}>
                            {filters.location === 'Remote' && <Check size={10} className="text-white" />}
                        </div>
                    </button>
                    
                    <button
                        onClick={() => {
                            const newSalary = filters.salaryMin === 150000 ? 0 : 150000;
                            onFilterChange({ salaryMin: newSalary });
                            onApply();
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-[0.7rem] font-black uppercase tracking-widest transition-all ${
                            filters.salaryMin >= 150000
                            ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                            : 'bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-white/10'
                        }`}
                    >
                        <span>High Value Roles</span>
                        <div className={`h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center ${
                            filters.salaryMin >= 150000 ? 'border-amber-500 bg-amber-500' : 'border-zinc-700'
                        }`}>
                            {filters.salaryMin >= 150000 && <Check size={10} className="text-white" />}
                        </div>
                    </button>
                </div>
            </div>

            {/* Quick Stats / Info */}
            <div className="pt-6 border-t border-white/5 mt-8">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-zinc-950 to-black border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-primary" />
                        <h4 className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary">Neural Optimization</h4>
                    </div>
                    <p className="text-[0.6rem] text-zinc-500 leading-relaxed font-bold italic">
                        "CALIBRATED DISCOVERY ARCHITECTURE ACTIVATED. SCANNING MARKET TENSORS FOR OPTIMAL ALIGNMENT."
                    </p>
                </div>
            </div>
        </div>
    );
}
