"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Activity, Pill, Calculator, CheckCircle2, Award, Users, ShieldCheck } from 'lucide-react';
import { ProductCard } from './ProductCard';

const PRODUCTS = [
  {
    title: "Hospital Management",
    description: "Enterprise-grade system with patient records, billing, and role-based access.",
    icon: Activity,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Pharmacy Manager",
    description: "Complete inventory, prescription tracking, and billing with offline support.",
    icon: Pill,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Accounts & Ledger",
    description: "Financial management featuring automated ledgers and professional reporting.",
    icon: Calculator,
    gradient: "from-indigo-500 to-purple-500",
  }
];

const STATS = [
  { label: "Patients Served", value: "37,000+", icon: Users },
  { label: "Error Reduction", value: "35%", icon: ShieldCheck },
  { label: "Experience", value: "10+ Yrs", icon: Award },
];

export const BrandingSection = () => {
  return (
    <div className="flex flex-col h-full p-8 md:p-12 lg:p-16 text-white overflow-y-auto scrollbar-none">
      {/* Brand Logo & Name */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 mb-12"
      >
        <img src="/AzanTech.png" alt="AzanTechSolutions Logo" className="w-12 h-12 object-contain shadow-lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AzanTechSolutions</h1>
          <p className="text-indigo-200 text-sm">Enterprise Software Systems</p>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div className="max-w-xl mb-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight"
        >
          Secure. Scalable. <br />
          <span className="text-indigo-300">Enterprise Ready.</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-indigo-100/80 leading-relaxed font-medium"
        >
          We deliver Oracle-first software solutions focused on integrity, performance, and auditing for hospitals and businesses across Pakistan.
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + (index * 0.1) }}
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center"
          >
            <stat.icon className="w-5 h-5 mx-auto mb-2 text-indigo-300" />
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-200/60 font-black">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Products Showcase */}
      <div className="mt-auto">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200/60 mb-6">Our Core Solutions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRODUCTS.map((product, index) => (
            <ProductCard 
              key={product.title}
              {...product}
              delay={0.6 + (index * 0.1)}
            />
          ))}
        </div>
      </div>

      {/* Footer Quote */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 flex items-center gap-3 text-indigo-200/40 text-sm font-medium"
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Trusted by Al Baseer Hospital and 100+ Enterprises.</span>
      </motion.div>
    </div>
  );
};
