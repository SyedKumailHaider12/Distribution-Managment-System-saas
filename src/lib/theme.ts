'use client';

import { useEffect, useState } from 'react';

/**
 * Simple theme hook for dark/light/system mode.
 * Stores preference in localStorage and updates <html data-theme> attribute.
 */
export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');

  // Initialise from storage / system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | 'system' | null;
    if (stored) {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'dark';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'light' : 'dark';
    });
  };

  return { theme, toggleTheme };
}
