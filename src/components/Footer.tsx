export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {currentYear} AzanTech DMS. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Distribution Management System
          </p>
        </div>
      </div>
    </footer>
  );
}