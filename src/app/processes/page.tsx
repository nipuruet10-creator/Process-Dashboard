'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  Users,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { store } from '../../lib/store';
import { Badge } from '../../components/ui/Badge';
import { formatCurrencyBDT } from '../../lib/calculations';
import { Process } from '../../types';

export default function ProcessesPage() {
  const [, setTick] = useState(0);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const processes = store.processes;
  const sections = store.sections;
  const machines = store.machines;

  const filtered = processes.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sub_process && p.sub_process.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.critical_parameters && p.critical_parameters.toLowerCase().includes(search.toLowerCase()));

    const matchesSection = sectionFilter === 'All' || p.section_id === sectionFilter;
    return matchesSearch && matchesSection;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Process Engineering Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard operating process sequences, cycle times, SAM allocation, and quality interlocks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin?action=new-process"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Add Process Step</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search processes, critical params..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Section:</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          >
            <option value="All">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Process Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Process Name</th>
                <th className="py-3 px-4">Section & Machine</th>
                <th className="py-3 px-4">Cycle Time</th>
                <th className="py-3 px-4">SAM</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Manpower</th>
                <th className="py-3 px-4">Cost / Piece</th>
                <th className="py-3 px-4">Critical Quality Control</th>
                <th className="py-3 px-4 text-right">SOP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((p) => {
                const sec = sections.find((s) => s.id === p.section_id);
                const mach = machines.find((m) => m.id === p.machine_id);

                return (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                      {p.sub_process && (
                        <p className="text-[11px] text-slate-500 font-medium">{p.sub_process}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm line-clamp-1">
                        {p.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{sec?.name || '-'}</span>
                      {mach && (
                        <p className="text-[11px] text-blue-600 font-mono">
                          {mach.machine_id} - {mach.name}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">{p.cycle_time_sec} s</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{p.sam_sec} s</td>
                    <td className="py-3.5 px-4 font-mono">{p.hourly_capacity || '-'} pcs/hr</td>
                    <td className="py-3.5 px-4 font-semibold">{p.manpower} op</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">৳{p.process_cost}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {p.critical_parameters ? (
                        <span className="text-[11px] text-rose-600 font-medium block">
                          {p.critical_parameters}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {p.quality_check && (
                        <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                          QC: {p.quality_check}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.sop_url ? (
                        <a
                          href={p.sop_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          SOP
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
