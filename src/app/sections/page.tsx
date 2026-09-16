'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Grid,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Cpu,
  Workflow,
  Gauge,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { store } from '../../lib/store';
import { Badge } from '../../components/ui/Badge';
import { formatNumber } from '../../lib/calculations';

export default function SectionsPage() {
  const [, setTick] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Maintenance'>('All');

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const sections = store.sections;
  const machines = store.machines;
  const processes = store.processes;
  const capacityRecords = store.capacityRecords;

  const filtered = sections.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.responsible_person && s.responsible_person.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Manufacturing Sections & Lines
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage all {sections.length} AC assembly, testing, charging, and packaging lines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin?action=new-section"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Create New Section</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, in-charge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((sec) => {
          const secMachines = machines.filter((m) => m.section_id === sec.id);
          const secProcesses = processes.filter((p) => p.section_id === sec.id);
          const secCap = capacityRecords
            .filter((c) => c.section_id === sec.id)
            .reduce((sum, r) => sum + (Number(r.daily_capacity) || 0), 0);

          return (
            <div
              key={sec.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-lg hover:border-blue-300"
            >
              {/* Photo or Header */}
              {sec.photo_url ? (
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={sec.photo_url}
                    alt={sec.name}
                    className="h-full w-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-lg bg-black/60 px-2 py-0.5 text-xs font-mono font-bold text-white border border-white/20">
                      {sec.code}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant={sec.status === 'Active' ? 'success' : 'warning'}>
                      {sec.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white">{sec.name}</h3>
                    <p className="text-xs text-slate-300">{sec.department}</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-800">
                      {sec.code}
                    </span>
                    <Badge variant="success">{sec.status}</Badge>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{sec.name}</h3>
                </div>
              )}

              {/* Body */}
              <div className="p-5 space-y-4 flex-1">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {sec.description || 'Continuous production line station.'}
                </p>

                {sec.responsible_person && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <User className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">In-Charge: {sec.responsible_person}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Machines</p>
                    <p className="text-sm font-bold text-slate-800">{secMachines.length}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Processes</p>
                    <p className="text-sm font-bold text-slate-800">{secProcesses.length}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Capacity</p>
                    <p className="text-sm font-bold text-slate-800">
                      {secCap > 0 ? formatNumber(secCap) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                <Link
                  href={`/sections/${sec.id}`}
                  className="flex items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow-xs"
                >
                  <span>Open Section Dashboard</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
