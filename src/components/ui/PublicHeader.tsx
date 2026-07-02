"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Menu, X, ChevronRight } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

const NAV_LINKS = [
  { name: 'About', href: '/#about' },
  { name: 'Products', href: '/#products' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Contact', href: '/#contact' },
];

export const PublicHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLight = theme === 'light';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: scrolled
          ? isLight ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled
          ? isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)'
          : 'none',
        paddingTop: scrolled ? '0.75rem' : '1.25rem',
        paddingBottom: scrolled ? '0.75rem' : '1.25rem',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/AzanTech.png"
            alt="AzanTechSolutions Logo"
            className="w-9 h-9 object-contain group-hover:scale-110 transition-transform"
          />
          <span
            className="font-bold text-xl tracking-tight transition-colors"
            style={{ color: isLight ? '#111827' : '#ffffff' }}
          >
            AzanTechSolutions
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium transition-colors hover:text-indigo-500"
              style={{ color: isLight ? '#4b5563' : '#94a3b8' }}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
              color: isLight ? '#374151' : '#94a3b8',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Toggle theme"
          >
            {isLight
              ? <Moon className="w-5 h-5" />
              : <Sun className="w-5 h-5 text-amber-400" />
            }
          </button>

          {/* Get Started — hidden on smallest screens */}
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ touchAction: 'manipulation' }}
          >
            Get Started
            <ChevronRight className="w-4 h-4" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center justify-center rounded-lg transition-colors"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
              color: isLight ? '#374151' : '#e2e8f0',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 p-6 md:hidden shadow-2xl"
          style={{
            background: isLight ? '#ffffff' : '#0f172a',
            borderBottom: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium transition-colors hover:text-indigo-500"
                style={{ color: isLight ? '#374151' : '#e2e8f0' }}
              >
                {link.name}
              </Link>
            ))}
            <hr style={{ borderColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)' }} className="my-1" />
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center font-bold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
