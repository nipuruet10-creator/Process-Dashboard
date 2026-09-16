import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10 text-blue-600',
    border: 'border-blue-100',
    glow: 'hover:border-blue-300',
  },
  indigo: {
    bg: 'bg-indigo-500/10 text-indigo-600',
    border: 'border-indigo-100',
    glow: 'hover:border-indigo-300',
  },
  emerald: {
    bg: 'bg-emerald-500/10 text-emerald-600',
    border: 'border-emerald-100',
    glow: 'hover:border-emerald-300',
  },
  amber: {
    bg: 'bg-amber-500/10 text-amber-600',
    border: 'border-amber-100',
    glow: 'hover:border-amber-300',
  },
  rose: {
    bg: 'bg-rose-500/10 text-rose-600',
    border: 'border-rose-100',
    glow: 'hover:border-rose-300',
  },
  purple: {
    bg: 'bg-purple-500/10 text-purple-600',
    border: 'border-purple-100',
    glow: 'hover:border-purple-300',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'blue',
}) => {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md ${c.border} ${c.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-3 ${c.bg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs">
          <span className={`font-semibold ${trendPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend}
          </span>
          <span className="ml-1.5 text-slate-400">vs target</span>
        </div>
      )}
    </div>
  );
};
