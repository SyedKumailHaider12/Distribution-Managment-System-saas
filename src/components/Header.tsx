"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Sun, Moon, User, ChevronDown, X, Package, ShoppingCart, Users, Building2, Warehouse, Tag, FileText, Truck, RotateCcw, BarChart3, Settings, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

const NAV_TABS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Supplier Companies', href: '/companies', icon: Building2 },
  { name: 'Suppliers', href: '/suppliers', icon: Building2 },
  { name: 'Categories', href: '/categories', icon: Tag },
  { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
  { name: 'Sales', href: '/sales', icon: ClipboardList },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Returns', href: '/returns/sales', icon: RotateCcw },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Reports', href: '/reports/sales', icon: BarChart3 },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface HeaderProps {
  toggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set active tab based on current path
    const currentTab = NAV_TABS.find(tab => pathname.startsWith(tab.href));
    if (currentTab) setActiveTab(currentTab.name);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Top Bar: Logo + Actions */}
      <div className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-slate-100 dark:border-slate-800">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/AzanTech.png" alt="AzanTechSolutions Logo" className="w-10 h-10 object-contain shadow-lg" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
              AzanTech<span className="text-indigo-600">Solutions</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution Management</p>
          </div>
        </div>

        {/* Right Side Actions - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          <button className="relative p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <User className="w-4 h-4" />
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Admin User</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">admin@azantech.com</p>
                  </div>
                  <div className="py-1">
                    <Link href="/profile" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 transition-colors">
                      Your Profile
                    </Link>
                    <Link href="/settings" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 transition-colors">
                      Settings
                    </Link>
                  </div>
                  <div className="py-1 border-t border-slate-100 dark:border-slate-700">
                    <button className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <span className="text-lg font-semibold">☰</span>}
        </button>
      </div>

      {/* Navigation Tabs - Desktop */}
      <nav className="hidden md:flex items-center gap-1 px-4 md:px-6 py-2 overflow-x-auto scrollbar-none">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              {tab.name}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <nav className="flex flex-col p-2">
              <div className="relative px-2 py-2 mb-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg pl-10 pr-4 py-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                {NAV_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pathname.startsWith(tab.href);
                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </Link>
                  );
                })}
              </div>
              {/* Mobile Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 px-2">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                  <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};