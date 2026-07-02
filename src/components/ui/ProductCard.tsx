"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ProductCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ title, description, icon: Icon, gradient }) => {
  return (
    <div className="glass-card group overflow-hidden hover:-translate-y-1 transition-transform duration-200">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
        {description}
      </p>
    </div>
  );
};
