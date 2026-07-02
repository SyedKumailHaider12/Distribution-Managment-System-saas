"use client";

import React from 'react';
import { Activity, Pill, Calculator, CheckCircle2, Award, Users, ShieldCheck } from 'lucide-react';
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
    <div
      className="flex flex-col h-full p-8 md:p-12 lg:p-16 overflow-y-auto scrollbar-none"
      style={{ color: 'var(--hero-text)' }}
    >
      {/* Hero Content — no logo here, logo is in header only */}
      <div className="max-w-xl mb-12">
        <h2
          className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight"
          style={{ color: 'var(--hero-text)' }}
        >
          Secure. Scalable. <br />
          <span className="text-indigo-400">Enterprise Ready.</span>
        </h2>
        <p
          className="text-lg leading-relaxed font-medium"
          style={{ color: 'var(--hero-text-muted)' }}
        >
          We deliver Oracle-first software solutions focused on integrity, performance, and auditing for hospitals and businesses across Pakistan.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-12">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center min-w-0 border"
            style={{
              background: 'rgba(99,102,241,0.08)',
              borderColor: 'rgba(99,102,241,0.15)',
            }}
          >
            <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 text-indigo-400" />
            <div
              className="text-sm sm:text-xl font-bold truncate"
              style={{ color: 'var(--hero-text)' }}
            >
              {stat.value}
            </div>
            <div
              className="text-[8px] sm:text-[10px] uppercase tracking-wide font-black leading-tight mt-0.5"
              style={{ color: 'var(--hero-text-muted)' }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Products Showcase */}
      <div className="mt-auto">
        <h3
          className="text-sm font-black uppercase tracking-widest mb-6"
          style={{ color: 'var(--hero-text-muted)' }}
        >
          Our Core Solutions
        </h3>
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
      <div
        className="mt-12 flex items-center gap-3 text-sm font-medium"
        style={{ color: 'var(--hero-text-muted)' }}
      >
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-indigo-400" />
        <span>Trusted by Al Baseer Hospital and 100+ Enterprises.</span>
      </div>
    </div>
  );
};
