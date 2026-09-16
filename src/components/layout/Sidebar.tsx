'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Grid,
  Cpu,
  GitCompare,
  Workflow,
  DollarSign,
  Timer,
  Gauge,
  FileText,
  BarChart3,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Wrench,
  Boxes,
} from 'lucide-react';
import { store } from '../../lib/store';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Sections', href: '/sections', icon: Grid },
    { label: 'Machines', href: '/machines', icon: Cpu },
    { label: 'Machine Compare', href: '/machines/compare', icon: GitCompare },
    { label: 'Processes', href: '/processes', icon: Workflow },
    { label: 'Process Cost', href: '/costs', icon: DollarSign },
    { label: 'SAM Module', href: '/sam', icon: Timer },
    { label: 'Capacity', href: '/capacity', icon: Gauge },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Admin Panel', href: '/admin', icon: Settings2, badge: 'Admin' },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-[#0B132B] text-slate-300 transition-all duration-300 ease-in-out select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-4">
        {!collapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
              IE
            </div>
            <div>
              <div className="text-xs font-black tracking-widest text-white uppercase">PROCESS DEV</div>
              <div className="text-[10px] font-medium text-slate-400">Walton Air Conditioner</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            IE
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition ${
            collapsed ? 'mx-auto mt-2' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {!collapsed && (
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Industrial Modules
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              } ${collapsed ? 'justify-center' : 'justify-between'}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer System Status Card */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Section Total</span>
              <span className="font-bold text-white">{store.sections.length || 10}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 mt-1.5">
              <span>Active Machines</span>
              <span className="font-bold text-emerald-400">
                {store.machines.filter((m) => m.status === 'Active').length || 18}
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Plant Line Status: Operational
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
