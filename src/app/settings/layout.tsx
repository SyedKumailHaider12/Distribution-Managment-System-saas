import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { Building2 } from 'lucide-react';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('settings');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-teal-600" /> Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure system preferences and company profile</p>
          </div>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
