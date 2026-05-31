"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ProductCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ title, description, icon: Icon, gradient, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card group overflow-hidden"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
        {description}
      </p>
    </motion.div>
  );
};
