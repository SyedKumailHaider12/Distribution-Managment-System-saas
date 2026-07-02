'use client';

import { BrandingSection } from '@/components/ui/BrandingSection';
import { AboutSection } from '@/components/ui/AboutSection';
import { PricingSection } from '@/components/ui/PricingSection';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--hero-bg)' }}>
      {/* Hero Section with Split Layout */}
      <section className="relative min-h-screen flex flex-col lg:flex-row pt-20 lg:pt-0">
        
        {/* LEFT SIDE: Visual / Branding (55%) */}
        <div className="lg:w-[55%] h-full relative hidden lg:block border-r" style={{ background: 'var(--hero-left-bg)', borderColor: 'var(--hero-border)' }}>
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        <div className="flex-1 flex items-start lg:items-center justify-center p-6 md:p-12 relative z-20">
          {/* Landing page Hero content for Mobile, CTA for Desktop */}
          <div className="w-full max-w-[480px] lg:max-w-none text-center lg:text-left">
            <div className="lg:hidden mb-12">
               <BrandingSection />
            </div>
            
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-4">
                <h2
                  className="text-4xl md:text-6xl font-black leading-tight tracking-tight"
                  style={{ color: 'var(--hero-text)' }}
                >
                  Secure. Scalable.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Enterprise Ready.</span>
                </h2>
                <p className="text-lg max-w-xl" style={{ color: 'var(--hero-text-muted)' }}>
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
                  className="px-8 py-4 font-bold rounded-xl border transition-all flex items-center justify-center hover:scale-[1.02]"
                  style={{ 
                    background: 'rgba(99,102,241,0.08)',
                    borderColor: 'rgba(99,102,241,0.2)',
                    color: 'var(--hero-text)'
                  }}
                >
                  Register Organization
                </Link>
              </div>

              <div
                className="flex items-center gap-4 justify-center lg:justify-start"
                style={{ color: 'var(--hero-text-muted)' }}
              >
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div
                       key={i}
                       className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                       style={{
                         borderColor: 'var(--hero-bg)',
                         background: 'rgba(99,102,241,0.3)',
                         color: 'var(--hero-text)'
                       }}
                     >
                        U{i}
                     </div>
                   ))}
                </div>
                <span className="text-xs font-medium tracking-wide">Trusted by 100+ businesses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page Sections */}
      <AboutSection />
      <PricingSection />
    </div>
  );
}
