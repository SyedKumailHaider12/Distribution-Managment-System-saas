import React from 'react';
import { GlassCard } from '@/components/GlassCard';

interface KPICardProps {
  title: string;
  value: string;
  accentColor: string; // e.g. '#4CAF50'
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, accentColor }) => {
  return (
    <GlassCard className="flex flex-col items-start">
      <p className="text-sm text-[var(--text-secondary)] mb-1">{title}</p>
      <h2 className="text-2xl font-bold" style={{ color: accentColor }}>{value}</h2>
    </GlassCard>
  );
};
