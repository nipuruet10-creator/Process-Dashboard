'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  Shield,
  Lock,
  LogOut,
  User,
  Database,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { store } from '../../lib/store';
import { UserRole } from '../../types';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { AdminLoginModal } from '../auth/AdminLoginModal';

export const Header: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(store.currentUser);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(store.isAdminAuthenticated);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.currentUser);
      setIsAdminAuthenticated(store.isAdminAuthenticated);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });
    return unsubscribe;
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSwitchUser = (role: UserRole) => {
    if (role === 'admin' && !store.isAdminAuthenticated) {
      setIsRoleDropdownOpen(false);
      setIsAdminLoginOpen(true);
      return;
    }
    const target = store.users.find((u) => u.role === role);
    if (target) {
      store.setCurrentUser(target);
    }
    setIsRoleDropdownOpen(false);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all factory sections, machines, and processes back to Walton demo seed data?')) {
      store.resetToSeedData();
    }
  };

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-rose-500/10 text-rose-700 border-rose-200',
    engineer: 'bg-blue-500/10 text-blue-700 border-blue-200',
    management: 'bg-purple-500/10 text-purple-700 border-purple-200',
    viewer: 'bg-slate-500/10 text-slate-700 border-slate-200',
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-[#D1E7DC] bg-gradient-to-r from-[#F3F9F6] via-[#FAF9F5] to-white px-6 shadow-xs backdrop-blur-md">
        {/* Left branding & title */}
        <div className="flex items-center space-x-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#082B52] text-white shadow-md shadow-blue-900/20">
            <Layers className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#082B52] uppercase">
                AC Process Development & Industrial Engineering
              </h1>
              <span className="hidden md:inline-flex items-center rounded-full bg-[#E8F5EE] px-2.5 py-0.5 text-[10px] font-bold text-[#146C43] border border-[#B7DEC9] uppercase tracking-wider">
                Walton RAC
              </span>
            </div>
            <p className="text-xs font-medium text-[#536778] tracking-wide">
              Process Development Division <span className="text-slate-300">|</span> Machine <span className="text-slate-300">•</span> Process Cost <span className="text-slate-300">•</span> SAM <span className="text-slate-300">•</span> Capacity <span className="text-slate-300">•</span> Specification
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="hidden sm:inline">Search records, machines...</span>
            <kbd className="hidden md:inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          {/* Status Indicators */}
          <div className="hidden lg:flex items-center space-x-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 border border-emerald-200 text-emerald-700 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-[11px]">System Online</span>
          </div>

          <div className="hidden xl:flex items-center text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>Updated: {lastUpdated}</span>
          </div>

          {/* User Role Selector & Admin menu */}
          {/* Admin Login / Active Status */}
          {isAdminAuthenticated ? (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-700 font-bold shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-rose-600" />
              <span className="hidden sm:inline">Admin Mode</span>
              <button
                onClick={() => store.logout()}
                className="ml-1 rounded-lg p-1 hover:bg-rose-100 text-rose-600 transition"
                title="Logout Admin Session"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>Admin Login</span>
            </button>
          )}

          {/* User Role Selector & Admin menu */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 hover:border-slate-300 transition shadow-2xs"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser?.full_name?.split(' ')[0]}
                </p>
                <span
                  className={`inline-block text-[10px] font-bold uppercase rounded px-1.5 py-0.2 border ${
                    roleColors[currentUser?.role || 'viewer']
                  }`}
                >
                  {currentUser?.role}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs"
                onClick={() => setIsRoleDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="font-bold text-slate-800">{currentUser.full_name}</p>
                  <p className="text-slate-400 text-[11px]">{currentUser.email}</p>
                  <p className="text-[10px] text-blue-600 mt-1 font-semibold">{currentUser.department}</p>
                </div>

                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch User Role
                </div>

                <button
                  onClick={() => handleSwitchUser('admin')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition ${
                    currentUser.role === 'admin' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center">
                    <Shield className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                    Admin (Full Access)
                  </span>
                  {currentUser.role === 'admin' && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                </button>

                <button
                  onClick={() => handleSwitchUser('engineer')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition ${
                    currentUser.role === 'engineer' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>Engineer (Create & Edit)</span>
                  {currentUser.role === 'engineer' && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                </button>

                <button
                  onClick={() => handleSwitchUser('management')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition ${
                    currentUser.role === 'management' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>Management (Dashboards & Reports)</span>
                  {currentUser.role === 'management' && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                </button>

                <button
                  onClick={() => handleSwitchUser('viewer')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition ${
                    currentUser.role === 'viewer' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>Viewer (Read Only)</span>
                  {currentUser.role === 'viewer' && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                </button>

                {isAdminAuthenticated && (
                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      onClick={() => store.logout()}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center transition"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      <span>Logout Admin Session</span>
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    onClick={handleResetData}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-2" />
                    <span>Reset Factory Demo Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Admin Login Dialog Modal */}
      <AdminLoginModal isOpen={isAdminLoginOpen} onClose={() => setIsAdminLoginOpen(false)} />
    </>
  );
};
