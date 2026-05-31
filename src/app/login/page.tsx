'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { BrandingSection } from '@/components/ui/BrandingSection';
import { AboutSection } from '@/components/ui/AboutSection';
import { PricingSection } from '@/components/ui/PricingSection';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [organizations, setOrganizations] = useState<{ id: number, name: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => {
        setOrganizations(data);
        if (data.length > 0) setOrganizationId(data[0].id.toString());
      })
      .catch(err => console.error('Failed to fetch orgs', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, organizationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      await refresh();
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-[#050816]">
      {/* Hero Section with Split Layout */}
      <section className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT SIDE: Visual / Branding (55%) */}
        <div id="products" className="lg:w-[55%] h-full relative hidden lg:block bg-[#0B1220] border-r border-white/5">
           <div className="absolute inset-0 overflow-hidden">
              {/* Soft blurred shapes / blobs */}
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]" />
              <div className="absolute top-[30%] right-[-5%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]" />
           </div>
           
           <div className="relative z-10 h-full flex items-center justify-center p-12">
             <div className="w-full h-full max-w-2xl">
               <BrandingSection />
             </div>
           </div>
        </div>

        {/* RIGHT SIDE: Form Container (45%) */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[460px] bg-[#111827]/75 backdrop-blur-[20px] rounded-[24px] border border-white/10 p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
                🚀 7-Day Free Trial Active
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Welcome Back</h2>
              <p className="text-slate-400 text-sm font-medium">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Organization Field */}
              <div className="space-y-2 group">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Organization</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <select
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full h-[44px] pl-12 pr-10 bg-[#0B1220] border border-white/5 rounded-[12px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer text-sm font-medium shadow-inner"
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-2 group">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-[44px] pl-12 pr-4 bg-[#0B1220] border border-white/5 rounded-[12px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium shadow-inner"
                    placeholder="e.g. kumail_rizvi"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 group">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Password</label>
                  <a href="#" className="text-[11px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[44px] pl-12 pr-12 bg-[#0B1220] border border-white/5 rounded-[12px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-white/10 bg-[#0B1220] text-indigo-500 focus:ring-indigo-500/50" 
                />
                <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none font-medium">Keep me signed in</label>
              </div>

              <button
                type="submit"
                disabled={loading || !organizationId}
                className="w-full h-[52px] bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] hover:shadow-[0_8px_20px_rgba(109,93,252,0.3)] text-white font-black rounded-[12px] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-sm tracking-[0.1em] uppercase mt-8"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-slate-500 text-xs font-medium">
              Don&apos;t have an organization? <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-black tracking-wide">Create account</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Landing Content */}
      <AboutSection />
      <PricingSection />
    </main>
  );
}
