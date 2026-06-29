'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Shield, ShieldAlert, ShieldCheck, Copy, Check } from 'lucide-react';
import Image from 'next/image';

export default function SecuritySettingsPage() {
  const { user, refresh } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string, qrCodeUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSetupData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess('Two-Factor Authentication enabled successfully!');
      setSetupData(null);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to disable 2FA');
      
      setSuccess('Two-Factor Authentication disabled');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Security Settings</h1>
        <p className="text-slate-400">Manage your account security and authentication methods.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="bg-[#0B1220] border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-8">
          <div className={`p-3 rounded-xl ${user?.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Add an extra layer of security to your account. When enabled, you'll be required to enter a 6-digit code from your authenticator app (like Google Authenticator or Authy) during login.
            </p>
          </div>
        </div>

        {user?.twoFactorEnabled ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 text-emerald-400 mb-4 sm:mb-0">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-semibold">2FA is currently enabled</span>
            </div>
            <button
              onClick={disable2FA}
              disabled={loading}
              className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-lg transition-colors text-sm"
            >
              Disable 2FA
            </button>
          </div>
        ) : setupData ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Step 1 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold">1</span>
                  <h3 className="font-semibold text-white">Scan QR Code</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Open your authenticator app and scan this QR code, or manually enter the setup key.
                </p>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <Image src={setupData.qrCodeUrl} alt="2FA QR Code" width={200} height={200} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Setup Key</label>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-[#050816] rounded-lg text-indigo-400 font-mono text-sm flex-1 break-all border border-white/5">
                      {setupData.secret}
                    </code>
                    <button 
                      onClick={copySecret}
                      className="p-2 bg-[#050816] hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold">2</span>
                  <h3 className="font-semibold text-white">Verify Code</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Enter the 6-digit code generated by your app to verify and complete the setup.
                </p>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full h-12 bg-[#050816] border border-white/10 rounded-xl px-4 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSetupData(null)}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={verifyAndEnable}
                      disabled={loading || totpCode.length !== 6}
                      className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={startSetup}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
            >
              {loading ? 'Starting...' : 'Enable 2FA Setup'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
