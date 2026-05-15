import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { User, Mail, Calendar, Edit2, Check, X, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEditing(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      <div className="card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center text-brand-400 text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          <div>
            <label className="label flex items-center gap-1.5">
              <User className="w-3 h-3" /> Full Name
            </label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
                <button
                  className="btn-primary px-3 py-2"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button className="btn-secondary px-3 py-2" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-surface-hover rounded-lg border border-surface-border">
                <span className="text-white text-sm">{user?.name}</span>
                <button
                  className="text-slate-500 hover:text-brand-400 transition-colors"
                  onClick={() => setEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
              <span className="text-slate-400 text-sm">{user?.email}</span>
              <span className="ml-2 text-xs text-slate-600">(cannot be changed)</span>
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Member Since
            </label>
            <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
              <span className="text-slate-400 text-sm">
                {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account stats */}
      <div className="card p-6 mt-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Account Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-hover rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">User ID</p>
            <p className="text-xs font-mono text-slate-300 truncate">{user?._id}</p>
          </div>
          <div className="bg-surface-hover rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-xs text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
