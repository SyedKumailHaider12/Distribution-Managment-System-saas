"use client";

import React from 'react';
import { Check, Zap } from 'lucide-react';

const PLANS = [
  {
    name: "Starter",
    price: "4,999",
    description: "Perfect for single pharmacies or small clinics.",
    features: ["Single Branch", "Basic Inventory", "Daily Reports", "Email Support"],
    popular: false,
  },
  {
    name: "Professional",
    price: "12,999",
    description: "Comprehensive solution for growing businesses.",
    features: ["Up to 3 Branches", "Advanced Batch Tracking", "HR & Payroll", "Priority Support"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Full-scale ERP for large hospitals & distributions.",
    features: ["Unlimited Branches", "Custom Analytics", "Audit Log Expert", "Dedicated Account Manager"],
    popular: false,
  },
];

export const PricingSection = () => {
  return (
    <div
      id="pricing"
      className="py-24 px-6 transition-colors duration-300"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto text-center mb-16">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-indigo-500 text-sm font-bold mb-6 border border-indigo-500/20"
          style={{ background: 'rgba(99,102,241,0.08)' }}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>7-Day Free Trial Available</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Choose the plan that fits your organization. No hidden fees, cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative p-8 rounded-3xl border shadow-xl transition-transform ${plan.popular ? 'scale-105 z-10' : ''}`}
            style={{
              background: 'var(--bg-card)',
              borderColor: plan.popular ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.12)',
              boxShadow: plan.popular ? '0 20px 40px rgba(99,102,241,0.15)' : undefined,
            }}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {plan.name}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {plan.description}
              </p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              {plan.price !== "Custom" && (
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Rs.</span>
              )}
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                {plan.price}
              </span>
              {plan.price !== "Custom" && (
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>/month</span>
              )}
            </div>
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-4 rounded-2xl font-bold transition-all transform active:scale-[0.98] ${
                plan.popular
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
                  : 'hover:opacity-80'
              }`}
              style={
                plan.popular
                  ? undefined
                  : { background: 'var(--bg-secondary)', color: 'var(--text-primary)' }
              }
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
