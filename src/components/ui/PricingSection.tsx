"use client";

import React from 'react';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
  {
    name: "Starter",
    price: "4,999",
    description: "Perfect for single pharmacies or small clinics.",
    features: ["Single Branch", "Basic Inventory", "Daily Reports", "Email Support"],
    gradient: "from-slate-500 to-slate-700",
    popular: false
  },
  {
    name: "Professional",
    price: "12,999",
    description: "Comprehensive solution for growing businesses.",
    features: ["Up to 3 Branches", "Advanced Batch Tracking", "HR & Payroll", "Priority Support"],
    gradient: "from-indigo-600 to-purple-600",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Full-scale ERP for large hospitals & distributions.",
    features: ["Unlimited Branches", "Custom Analytics", "Audit Log Expert", "Dedicated Account Manager"],
    gradient: "from-amber-500 to-orange-600",
    popular: false
  }
];

export const PricingSection = () => {
  return (
    <div id="pricing" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-6"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>7-Day Free Trial Available</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Choose the plan that fits your organization. No hidden fees, cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-8 rounded-3xl border ${
              plan.popular 
                ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/50 shadow-2xl scale-105 z-10' 
                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-xl'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              {plan.price !== "Custom" && <span className="text-slate-500 font-medium">Rs.</span>}
              <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
              {plan.price !== "Custom" && <span className="text-slate-500 text-sm font-medium">/month</span>}
            </div>
            <ul className="space-y-4 mb-8">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <Check className="w-3 h-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            <button className={`w-full py-4 rounded-2xl font-bold transition-all transform active:scale-[0.98] ${
              plan.popular 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25' 
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white'
            }`}>
              Get Started
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
