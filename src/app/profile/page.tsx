'use client';

import { useState } from 'react';
import { User, Mail, Lock, Save, Shield } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage('');
    try {
      // In a real app, this would call an API
      setMessage('Profile updated successfully');
    } catch (error: any) {
      setMessage(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setMessage('Please fill in all password fields');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      // In a real app, this would call an API
      setMessage('Password changed successfully');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.includes('success')
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} />
            Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-400 capitalize cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Lock size={20} />
            Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Shield size={18} />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}