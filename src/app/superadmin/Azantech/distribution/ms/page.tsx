'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/superadmin/dashboard');
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050816] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-orange-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-[#111827]/80 backdrop-blur-[20px] rounded-[24px] border border-red-500/20 p-8 md:p-10 shadow-[0_20px_60px_rgba(220,38,38,0.15)] relative z-10"
      >
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">SuperAdmin Control</h2>
          <p className="text-red-400/80 text-xs font-bold uppercase tracking-widest mt-2">Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2 group">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Admin ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full h-[44px] pl-12 pr-4 bg-[#0B1220] border border-white/5 rounded-[12px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm font-medium shadow-inner"
                placeholder="Username or Email"
                required
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Master Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[44px] pl-12 pr-4 bg-[#0B1220] border border-white/5 rounded-[12px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm font-medium shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 hover:shadow-[0_8px_20px_rgba(220,38,38,0.3)] text-white font-black rounded-[12px] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-sm tracking-[0.1em] uppercase mt-8"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Authenticate
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
