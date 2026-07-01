'use client';

import { useState, useEffect } from 'react';
import { User, Search, ShieldAlert, LogIn, Loader2, Ban, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AppUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  fullName: string | null;
  isActive: boolean;
  isBlocked: boolean;
  organization: { name: string };
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/superadmin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user: AppUser) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !user.isBlocked })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to update user status');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (user: AppUser) => {
    if (!confirm(`Log in as ${user.username} (${user.organization.name})?`)) return;
    
    setActionLoading(user.id);
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        window.location.href = '/dashboard'; // Force full reload to apply tenant session
      } else {
        alert('Failed to impersonate user');
        setActionLoading(null);
      }
    } catch (e) {
      alert('Error impersonating');
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">Note: Passwords are encrypted and cannot be viewed. Use "Impersonate" to log in as them.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-10 pl-10 pr-4 bg-[#111827] border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Organization</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.fullName || user.username}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{user.organization.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">
                        <Ban className="w-3 h-3" /> Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleImpersonate(user)}
                        disabled={actionLoading === user.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors text-xs font-bold uppercase"
                        title="Log in as this user"
                      >
                        {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                        Login As
                      </button>
                      <button 
                        onClick={() => handleToggleBlock(user)}
                        disabled={actionLoading === user.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold uppercase ${
                          user.isBlocked 
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.isBlocked ? (
                          <><CheckCircle className="w-4 h-4" /> Unblock</>
                        ) : (
                          <><Ban className="w-4 h-4" /> Block</>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
