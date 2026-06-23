import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { ShoppingBag } from 'lucide-react';

export default async function PurchasesLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('inventory');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-amber-600" /> Purchases
            </h1>
          </div>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
