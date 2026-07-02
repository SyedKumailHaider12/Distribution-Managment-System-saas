"use client";

import React from 'react';
import { Shield, Rocket, Heart } from 'lucide-react';

const VALUES = [
  { icon: Shield, title: "Data Integrity", desc: "We prioritize the security and accuracy of your business data above all else." },
  { icon: Rocket, title: "Innovation", desc: "Continuously evolving our products with the latest technologies like Next.js and Oracle." },
  { icon: Heart, title: "Customer Success", desc: "Your growth is our mission. Dedicated support to ensure your business thrives." },
];

export const AboutSection = () => {
  return (
    <div
      id="about"
      className="py-24 px-6 transition-colors duration-300"
      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div className="animate-fadeIn">
            <h4 className="text-indigo-500 font-bold uppercase tracking-widest text-sm mb-4">Our Story</h4>
            <h2
              className="text-4xl md:text-5xl font-black mb-8 tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Leading the Digital Transformation in Pakistan
            </h2>
            <p
              className="text-lg mb-8 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              AzanTech Solutions is a premier software house dedicated to delivering high-performance,
              enterprise-grade systems. From the heart of Pindi Bhattian, we empower hospitals,
              pharmacies, and businesses across the nation with secure and scalable digital solutions.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-3xl font-black text-indigo-500 mb-1">10+</div>
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Years Experience
                </p>
              </div>
              <div>
                <div className="text-3xl font-black text-indigo-500 mb-1">100+</div>
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Happy Clients
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {VALUES.map((val, i) => (
              <div
                key={i}
                className="flex gap-6 p-6 rounded-3xl border hover:border-indigo-500/30 transition-colors group"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'rgba(99,102,241,0.1)',
                }}
              >
                <div
                  className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-indigo-500 shadow-lg group-hover:scale-110 transition-transform"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <val.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {val.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {val.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
