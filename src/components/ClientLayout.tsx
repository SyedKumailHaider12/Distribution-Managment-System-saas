"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { PublicHeader } from './ui/PublicHeader';
import { PublicFooter } from './ui/PublicFooter';
import { AuthProvider, useAuth } from './AuthProvider';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/landing' || pathname === '/';
  const isVerifyPage = pathname === '/verify-email';
  const isBillingPage = pathname === '/billing';

  useEffect(() => {
    if (!loading && !user && !isPublicPage && !isVerifyPage) {
      router.push('/login');
    }

    if (!loading && user && !user.emailVerified && !isVerifyPage && !isPublicPage) {
      router.push('/verify-email');
    }

    
    if (!loading && user && user.emailVerified && !isPublicPage && !isBillingPage && !isVerifyPage) {
      if (user.subscriptionStatus === 'EXPIRED') {
         router.push('/billing');
      } else if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt) {
         const trialEnds = new Date(user.trialEndsAt);
         if (new Date() > trialEnds) {
            router.push('/billing');
         }
      } else if (user.subscriptionStatus === 'ACTIVE' && user.subscriptionEndsAt) {
         const subEnds = new Date(user.subscriptionEndsAt);
         if (new Date() > subEnds) {
            router.push('/billing');
         }
      }
    }
  }, [user, loading, router, isPublicPage, isBillingPage, isVerifyPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isPublicPage) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <PublicHeader />
        <main className="flex-1">
          {children}
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (isVerifyPage) {
    return (
      <main className="min-h-screen bg-[#020817]">
        {children}
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 z-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}