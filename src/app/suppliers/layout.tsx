import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { Truck } from 'lucide-react';

export default async function SuppliersLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('people');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-amber-600" /> Suppliers
          </h1>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
