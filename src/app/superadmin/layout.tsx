'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  LogOut, 
  ShieldAlert,
  Loader2,
  Menu,
  X,
  Activity
} from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Only check auth if we aren't on the login page
    if (pathname === '/superadmin/Azantech/distribution/ms') {
      setLoading(false);
      return;
    }

    fetch('/api/superadmin/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
          setLoading(false);
        } else {
          router.push('/superadmin/Azantech/distribution/ms');
        }
      })
      .catch(() => {
        router.push('/superadmin/Azantech/distribution/ms');
      });
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/superadmin/session', { method: 'DELETE' });
    router.push('/superadmin/Azantech/distribution/ms');
  };

  // Don't wrap login page with the dashboard layout
  if (pathname === '/superadmin/Azantech/distribution/ms') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { href: '/superadmin/Azantech/distribution/ms/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/superadmin/Azantech/distribution/ms/organizations', icon: Building2, label: 'Organizations' },
    { href: '/superadmin/Azantech/distribution/ms/users', icon: Users, label: 'All Users' },
    { href: '/superadmin/Azantech/distribution/ms/audit-logs', icon: Activity, label: 'Audit Logs' },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B1220] border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <span className="font-black tracking-widest uppercase text-sm text-white">SUPERADMIN</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold uppercase">
              {user?.username?.[0] || 'S'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.fullName || 'Super Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.username}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header (Mobile) */}
        <header className="h-16 lg:hidden flex items-center justify-between px-4 border-b border-white/5 bg-[#0B1220]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <span className="font-black tracking-widest uppercase text-sm">SUPERADMIN</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#050816] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
