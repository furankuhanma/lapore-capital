import React, { useState } from 'react';
import { User, Mail, LogOut, Save, X, Check, AlertCircle, Shield, Bell, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../../src/context/types';
import { useAuth } from '../../src/context/AuthContext';

interface SettingsTabProps {
  currentUser: Profile;
  onRefresh?: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ currentUser, onRefresh }) => {
  const { signOut } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [username, setUsername] = useState(currentUser.username);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!fullName.trim() || !username.trim()) {
      setError('Full name and username are required');
      return;
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setSaving(true);

    try {
      // Check if username is taken (if changed)
      if (username !== currentUser.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (existingUser) {
          setError('Username is already taken');
          setSaving(false);
          return;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      setEditMode(false);
      
      // Refresh profile data
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 500);
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(currentUser.full_name);
    setUsername(currentUser.username);
    setEditMode(false);
    setError('');
    setSuccess('');
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
      </div>

      {/* Profile Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Profile Information
        </h3>

        <div className="bg-cardbg border border-white/5 rounded-2xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name)}&background=3C3CFF&color=fff&rounded=true`}
              alt={currentUser.full_name}
              className="w-20 h-20 rounded-full border-2 border-ethblue shadow-lg shadow-ethblue/20"
            />
            <div>
              <h4 className="text-lg font-bold text-white">{currentUser.full_name}</h4>
              <p className="text-sm text-slate-400">@{currentUser.username}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editMode}
                  className="w-full bg-darkbg border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-ethblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!editMode}
                  className="w-full bg-darkbg border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-ethblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  type="email"
                  value={currentUser.id} // This should be email from auth
                  disabled
                  className="w-full bg-darkbg border border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-600 opacity-50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 bg-ethblue hover:bg-ethblue/90 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-ethblue hover:bg-ethblue/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Save className="w-5 h-5 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Preferences
        </h3>

        <div className="bg-cardbg border border-white/5 rounded-2xl divide-y divide-white/5">
          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="text-white font-medium">Notifications</span>
            </div>
            <div className="w-12 h-6 bg-ethblue rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-slate-400" />
              <span className="text-white font-medium">Show Balance</span>
            </div>
            <div className="w-12 h-6 bg-ethblue rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Security
        </h3>

        <div className="bg-cardbg border border-white/5 rounded-2xl divide-y divide-white/5">
          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-white font-medium">Change Password</p>
                <p className="text-xs text-slate-500 mt-0.5">Update your password</p>
              </div>
            </div>
            <span className="text-slate-500">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security</p>
              </div>
            </div>
            <span className="text-slate-500">→</span>
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          About
        </h3>

        <div className="bg-cardbg border border-white/5 rounded-2xl divide-y divide-white/5">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ethblue/20 rounded-full flex items-center justify-center">
                <span className="text-ethblue font-bold">L</span>
              </div>
              <div>
                <p className="text-white font-bold">Lapore Finance</p>
                <p className="text-xs text-slate-500">Version 1.0.0</p>
              </div>
            </div>
          </div>

          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <span className="text-white font-medium">Terms of Service</span>
            <span className="text-slate-500">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <span className="text-white font-medium">Privacy Policy</span>
            <span className="text-slate-500">→</span>
          </button>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Sign Out
      </button>
    </div>
  );
};

export default SettingsTab;