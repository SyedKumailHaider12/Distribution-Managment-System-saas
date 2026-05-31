"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Rocket, Heart } from 'lucide-react';

const VALUES = [
  { icon: Shield, title: "Data Integrity", desc: "We prioritize the security and accuracy of your business data above all else." },
  { icon: Rocket, title: "Innovation", desc: "Continuously evolving our products with the latest technologies like Next.js and Oracle." },
  { icon: Heart, title: "Customer Success", desc: "Your growth is our mission. Dedicated support to ensure your business thrives." },
];

export const AboutSection = () => {
  return (
    <div id="about" className="py-24 px-6 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4">Our Story</h4>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
              Leading the Digital Transformation in Pakistan
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              AzanTech Solutions is a premier software house dedicated to delivering high-performance, enterprise-grade systems. From the heart of Pindi Bhattian, we empower hospitals, pharmacies, and businesses across the nation with secure and scalable digital solutions.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-3xl font-black text-indigo-600 mb-1">10+</div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Years Experience</p>
              </div>
              <div>
                <div className="text-3xl font-black text-indigo-600 mb-1">100+</div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Happy Clients</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6"
          >
            {VALUES.map((val, i) => (
              <div key={i} className="flex gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-colors group">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                  <val.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{val.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{val.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
