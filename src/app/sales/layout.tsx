import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { ShoppingCart } from 'lucide-react';

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('sales');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-indigo-600" /> Sales Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Access Restricted</p>
          </div>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
