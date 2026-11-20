import React from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-slate-50 text-slate-600 border-slate-200',
  trend,
  highlight,
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl p-4 border transition-all shadow-xs hover:border-slate-300',
        highlight
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-slate-200/90'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center border text-sm shrink-0', iconBg)}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>}
    </div>
  );
};
