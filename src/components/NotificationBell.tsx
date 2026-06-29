'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Package, X, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Notification {
  id: string;
  type: 'low_stock' | 'expiring';
  title: string;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState({ total: 0, critical: 0, lowStock: 0, expiring: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setCounts(data.counts || { total: 0, critical: 0, lowStock: 0, expiring: 0 });
    } catch (e) {
      // silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
      >
        <Bell className="w-5 h-5" />
        {counts.total > 0 && (
          <span className={`absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black text-white rounded-full px-1 border-2 border-white dark:border-slate-900 ${counts.critical > 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
            {counts.total > 99 ? '99+' : counts.total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[380px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {counts.lowStock} low stock · {counts.expiring} expiring
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-400">No alerts right now</p>
                  <p className="text-xs text-slate-400 mt-1">Everything is running smoothly ✨</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.severity === 'critical'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'
                    }`}>
                      {n.type === 'low_stock' ? (
                        <Package className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed truncate">
                        {n.message}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      n.severity === 'critical'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    }`}>
                      {n.severity}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <a
                  href="/reports/stock"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center justify-center gap-1"
                >
                  View Stock Report →
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
