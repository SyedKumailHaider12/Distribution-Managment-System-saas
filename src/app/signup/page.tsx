'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Building2, UserPlus, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { registerOrganization } from './actions';
import { BrandingSection } from '@/components/ui/BrandingSection';
import { AboutSection } from '@/components/ui/AboutSection';
import { PricingSection } from '@/components/ui/PricingSection';
import Link from 'next/link';

// Reusable themed input style
const inputStyle: React.CSSProperties = {
  background: 'var(--hero-input-bg)',
  color: 'var(--hero-text)',
  borderColor: 'var(--hero-border)',
};

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    orgName: '',
    adminName: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    address: '',
    city: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await registerOrganization(formData);
      if (result.success) {
        router.push('/login');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-[44px] px-4 py-3 border rounded-[12px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium";
  const inputWithIconClass = "w-full h-[44px] pl-12 pr-4 py-3 border rounded-[12px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium";
  const labelClass = "text-[11px] font-black uppercase tracking-[0.1em] ml-1";

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--hero-bg)' }}>
      <section className="relative min-h-screen flex flex-col lg:flex-row">
        {/* LEFT SIDE */}
        <div id="products" className="lg:w-[55%] h-full relative hidden lg:block border-r"
          style={{ background: 'var(--hero-left-bg)', borderColor: 'var(--hero-border)' }}>
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

        {/* RIGHT SIDE: Form */}
        <div className="flex-1 flex items-start lg:items-center justify-center p-6 md:p-12 relative z-20 pt-20 lg:pt-12">
          <div
            className="w-full max-w-[480px] rounded-[24px] border p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-fadeIn"
            style={{ background: 'var(--hero-card-bg)', borderColor: 'var(--hero-border)', backdropFilter: 'blur(20px)' }}
          >
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
                🌟 Start Your 7-Day Free Trial
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight" style={{ color: 'var(--hero-text)' }}>
                Create Organization
              </h2>
              <p className="text-sm font-medium" style={{ color: 'var(--hero-text-muted)' }}>
                Join 100+ businesses using AzanTechSolutions DMS.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Org Name */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>Organization Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    className={inputWithIconClass}
                    style={inputStyle}
                    placeholder="e.g. Enter Your Organization Name"
                    required
                  />
                </div>
              </div>

              {/* Admin Name */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>Admin Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className={inputWithIconClass}
                    style={inputStyle}
                    placeholder="e.g. Kumail Rizvi"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. +92 300 1234567"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. contact@zafarmedical.com"
                  required
                />
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. Lahore"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>Full Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 123 Main St, Block B"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>Admin Username</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={inputWithIconClass}
                    style={inputStyle}
                    placeholder="e.g. admin_zafar"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className={labelClass} style={{ color: 'var(--hero-text-muted)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-[44px] pl-12 pr-12 border rounded-[12px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium"
                    style={inputStyle}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] hover:shadow-[0_8px_20px_rgba(109,93,252,0.3)] text-white font-black rounded-[12px] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-sm tracking-[0.1em] uppercase mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Register Organization
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs font-medium" style={{ color: 'var(--hero-text-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-black tracking-wide">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <AboutSection />
      <PricingSection />
    </div>
  );
}
