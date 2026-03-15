import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIBadgeProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: 'fix' | 'generate' | 'rewrite' | 'analyze';
  className?: string;
}

export const AIBadge: React.FC<AIBadgeProps> = ({ 
  label, 
  onClick, 
  loading = false, 
  disabled = false,
  type = 'fix',
  className = ''
}) => {
  const baseStyles = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[0.6rem] font-black uppercase tracking-wider transition-all duration-300 border shadow-sm hover:shadow-md active:scale-95";
  
  const typeStyles = {
    fix: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
    generate: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20",
    rewrite: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
    analyze: "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20",
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled || loading}
      className={`${baseStyles} ${typeStyles[type]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {loading ? (
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <Sparkles size={10} />
      )}
      {loading ? 'Processing...' : label}
    </button>
  );
};
