'use client';

import { BrandingSection } from '@/components/ui/BrandingSection';
import { AboutSection } from '@/components/ui/AboutSection';
import { PricingSection } from '@/components/ui/PricingSection';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col bg-[#050816]">
      {/* Hero Section with Split Layout */}
      <section className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden pt-20 lg:pt-0">
        
        {/* LEFT SIDE: Visual / Branding (55%) */}
        <div className="lg:w-[55%] h-full relative hidden lg:block bg-[#0B1220] border-r border-white/5">
           <div className="absolute inset-0 overflow-hidden">
              {/* Soft blurred shapes / blobs */}
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]" />
           </div>
           
           <div className="relative z-10 h-full flex items-center justify-center p-12">
             <div className="w-full h-full max-w-2xl">
               <BrandingSection />
             </div>
           </div>
        </div>

        {/* RIGHT SIDE: CTA Area (45%) */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-20">
          {/* Landing page Hero content for Mobile, CTA for Desktop */}
          <div className="w-full max-w-[480px] lg:max-w-none text-center lg:text-left">
            <div className="lg:hidden mb-12">
               <BrandingSection />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                  Secure. Scalable.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Enterprise Ready.</span>
                </h2>
                <p className="text-lg text-slate-400 max-w-xl">
                  Oracle-first enterprise software for hospitals, pharmacies and businesses across Pakistan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href="/login"
                  className="px-8 py-4 bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                  Sign In to Dashboard
                </Link>
                <Link 
                  href="/signup"
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center"
                >
                  Register Organization
                </Link>
              </div>

              <div className="flex items-center gap-4 text-slate-500 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050816] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                        U{i}
                     </div>
                   ))}
                </div>
                <span className="text-xs font-medium tracking-wide">Trusted by 100+ businesses</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Page Sections */}
      <AboutSection />
      <PricingSection />
    </main>
  );
}
