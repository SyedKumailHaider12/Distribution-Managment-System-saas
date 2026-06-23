import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function AccessRestricted() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 mt-6 shadow-sm">
      <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-400 opacity-50" />
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Access Restricted</h2>
      <p className="text-slate-500 mt-2">You do not have permission to view or manage this module.</p>
    </div>
  );
}
