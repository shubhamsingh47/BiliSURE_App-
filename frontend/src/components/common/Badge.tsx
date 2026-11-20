import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  variant?: 'pending' | 'reviewed' | 'critical' | 'moderate' | 'normal' | 'available' | 'occupied' | 'maintenance' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children, size = 'md' }) => {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    reviewed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    moderate: 'bg-orange-50 text-orange-700 border-orange-200',
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    occupied: 'bg-purple-50 text-purple-700 border-purple-200',
    maintenance: 'bg-slate-100 text-slate-600 border-slate-300',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium border rounded-full',
        styles[variant] || styles.info,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      {children}
    </span>
  );
};
