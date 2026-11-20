import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  variant?: 'pending' | 'reviewed' | 'critical' | 'moderate' | 'normal' | 'available' | 'occupied' | 'maintenance' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children, size = 'md' }) => {
  const styles: Record<string, { bg: string; dot: string }> = {
    pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    reviewed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    critical: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    moderate: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    normal: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    available: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    occupied: { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    maintenance: { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    info: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  };

  const current = styles[variant] || styles.info;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold border rounded-md leading-none tracking-tight',
        current.bg,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', current.dot)} />
      <span>{children}</span>
    </span>
  );
};
