'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { BrandingSection } from '@/components/ui/BrandingSection';
import { AboutSection } from '@/components/ui/AboutSection';
import { PricingSection } from '@/components/ui/PricingSection';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Org autocomplete
  const [orgQuery, setOrgQuery] = useState('');
  const [orgSuggestions, setOrgSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<{ id: number; name: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  // Debounced org search
  useEffect(() => {
    if (orgQuery.length < 1 || selectedOrg) {
      setOrgSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/organizations/search?q=${encodeURIComponent(orgQuery)}`);
        if (!res.ok) return;
        const data = await res.json();
        setOrgSuggestions(Array.isArray(data) ? data : []);
        setShowDropdown(Array.isArray(data) && data.length > 0);
      } catch {
        // network error — silently ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [orgQuery, selectedOrg]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectOrg = (org: { id: number; name: string }) => {
    setSelectedOrg(org);
    setOrgQuery(org.name);
    setShowDropdown(false);
    setOrgSuggestions([]);
  };

  const handleOrgInputChange = (val: string) => {
    setOrgQuery(val);
    if (selectedOrg && val !== selectedOrg.name) {
      setSelectedOrg(null); // reset selection if user edits
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedOrg) {
      setError('Please select your organization from the dropdown suggestions.');
      return;
    }

    setLoading(true);

    try {
      // Use AbortController so slow DB/network doesn't freeze the button forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, organizationId: selectedOrg.id, totpCode }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      await refresh();
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. The server may be starting up — please try again in a few seconds.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--hero-bg)' }}>
      {/* Hero Section with Split Layout */}
      <section className="relative min-h-screen flex flex-col lg:flex-row">
        
        {/* LEFT SIDE: Visual / Branding (55%) */}
        <div id="products" className="lg:w-[55%] h-full relative hidden lg:block border-r" style={{ background: 'var(--hero-left-bg)', borderColor: 'var(--hero-border)' }}>
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        <div className="flex-1 flex items-start lg:items-center justify-center p-6 md:p-12 relative z-20 pt-20 lg:pt-12">
          <div 
            className="w-full max-w-[460px] rounded-[24px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-fadeIn border"
            style={{ background: 'var(--hero-card-bg)', borderColor: 'var(--hero-border)', backdropFilter: 'blur(20px)' }}
          >
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
                🚀 7-Day Free Trial Active
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight" style={{ color: 'var(--hero-text)' }}>Welcome Back</h2>
              <p className="text-sm font-medium" style={{ color: 'var(--hero-text-muted)' }}>Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div 
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium"
                >
                  {error}
                </div>
              )}

              {!requires2FA ? (
                <>
                  {/* Organization Autocomplete */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Organization</label>
                    <div className="relative" ref={dropdownRef}>
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10 transition-colors" />
                      <input
                        type="text"
                        autoComplete="off"
                        value={orgQuery}
                        onChange={(e) => handleOrgInputChange(e.target.value)}
                        onFocus={() => { if (orgSuggestions.length > 0) setShowDropdown(true); }}
                        className={`w-full h-[44px] pl-12 pr-10 border rounded-[12px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium shadow-inner ${selectedOrg ? 'border-emerald-500/40' : ''}`}
                        style={{ background: 'var(--hero-input-bg)', color: 'var(--hero-text)', borderColor: selectedOrg ? undefined : 'var(--hero-border)' }}
                        placeholder="Type your organization name..."
                        required
                      />
                      {selectedOrg && (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      )}
                      {showDropdown && orgSuggestions.length > 0 && (
                        <ul className="absolute z-[999] top-full mt-1.5 w-full bg-[#0d1526] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                          {orgSuggestions.map((org) => (
                            <li key={org.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectOrg(org)}
                                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors flex items-center gap-3"
                              >
                                <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                {org.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {orgQuery.length > 0 && !selectedOrg && orgSuggestions.length === 0 && (
                      <p className="text-xs text-slate-500 ml-1">No matching organizations found.</p>
                    )}
                  </div>

                  {/* Username or Email */}
                  <div className="space-y-2 group">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Username or Email</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full h-[44px] pl-12 pr-4 border rounded-[12px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium shadow-inner"
                        style={{ background: 'var(--hero-input-bg)', color: 'var(--hero-text)', borderColor: 'var(--hero-border)' }}
                        placeholder="Enter username or email"
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
                        className="w-full h-[44px] pl-12 pr-12 border rounded-[12px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium shadow-inner"
                        style={{ background: 'var(--hero-input-bg)', color: 'var(--hero-text)', borderColor: 'var(--hero-border)' }}
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
                    <label htmlFor="remember" className="text-sm cursor-pointer select-none font-medium" style={{ color: 'var(--hero-text-muted)' }}>Keep me signed in</label>
                  </div>
                </>
              ) : (
                <div className="space-y-2 group">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Authenticator Code</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="w-full h-[44px] pl-12 pr-4 bg-[#0B1220] border border-white/5 rounded-[12px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium shadow-inner text-center tracking-widest text-lg"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">Open your Authenticator app and enter the 6-digit code.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
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

            <p className="mt-10 text-center text-xs font-medium" style={{ color: 'var(--hero-text-muted)' }}>
              Don&apos;t have an organization? <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-black tracking-wide">Create account</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Landing Content */}
      <AboutSection />
      <PricingSection />
    </div>
  );
}
