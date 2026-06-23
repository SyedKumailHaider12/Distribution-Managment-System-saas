"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { processMockPayment } from './actions';
import { useAuth } from '@/components/AuthProvider';

export default function BillingPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.subscriptionStatus === 'ACTIVE') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await processMockPayment();
      if (res.success) {
        setSuccess(true);
        await refresh();
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-8 text-center bg-indigo-600">
          <ShieldCheck className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Subscription Required</h1>
          <p className="text-indigo-100 text-sm">
            {user.subscriptionStatus === 'EXPIRED' 
              ? 'Your subscription has expired.' 
              : 'Your 7-day trial has concluded.'}
          </p>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Payment Successful!</h2>
              <p className="text-slate-500 dark:text-slate-400">Your account has been reactivated.</p>
              <p className="text-sm text-slate-400 mt-4 animate-pulse">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Pro Plan - Monthly</h2>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Renewal Fee</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">$49.00</span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay with Mock Gateway
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-slate-400">
                  This is a secure mock payment for demonstration. No real charges are made.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
