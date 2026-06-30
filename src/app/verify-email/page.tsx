'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setResendCooldown(60);
        setResendMessage('A new code has been sent to your email.');
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        await refresh();
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-[#0B1220]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
          <p className="text-slate-400 text-center text-sm">
            We sent a 6-digit code to <strong className="text-white">{user?.email}</strong>. Enter it below to access your dashboard.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-xl flex flex-col items-center gap-3 text-center animate-in zoom-in duration-300">
            <ShieldCheck className="w-12 h-12" />
            <div>
              <p className="font-bold text-lg">Email Verified!</p>
              <p className="text-sm opacity-80 mt-1">Redirecting you to dashboard...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-[#020817] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center text-2xl tracking-[0.5em] font-mono"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            {resendMessage && (
              <p className="text-emerald-400 text-sm mb-3">{resendMessage}</p>
            )}
            <p className="text-sm text-slate-400">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                className="text-indigo-400 font-semibold hover:text-indigo-300 disabled:opacity-50 disabled:hover:text-indigo-400 transition-colors"
              >
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
