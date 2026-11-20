import React from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight,
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md',
        highlight ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200/80'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && <span className="text-xs font-semibold text-emerald-600">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>}
    </div>
  );
};
