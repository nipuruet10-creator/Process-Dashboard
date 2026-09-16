'use client';

import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { store } from '../../lib/store';
import { Modal } from '../ui/Modal';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [adminId, setAdminId] = useState('admin');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = store.login(adminId, password);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setErrorMsg(res.message || 'Invalid Admin ID or Password.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Access Authentication"
      subtitle="Administrative authorization required to modify system configuration and line records"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-3 rounded-xl bg-blue-50 border border-blue-200 p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900">Protected Administrative Area</h4>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Please enter your authorized Admin ID and Password to proceed.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Authentication successful! Granting admin privileges...</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Admin ID</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-500">
          <span className="font-bold text-slate-700">Credentials: </span>
          ID: <code className="font-mono font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">admin</code>
          <span className="mx-1.5">|</span>
          Password: <code className="font-mono font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">ACprocess@2026</code>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSuccess}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {isSuccess ? 'Verified...' : 'Login as Admin'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
