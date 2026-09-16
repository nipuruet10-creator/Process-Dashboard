'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  ArrowRight,
  GitCompare,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Trash2,
  Edit,
  Eye,
  Layers,
} from 'lucide-react';
import { store } from '../../lib/store';
import { Badge } from '../../components/ui/Badge';
import { Machine, MachineStatus } from '../../types';

export default function MachinesPage() {
  const router = useRouter();
  const [, setTick] = useState(0);

  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | MachineStatus>('All');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const machines = store.machines;
  const sections = store.sections;

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 4) {
        alert('You can compare a maximum of 4 machines simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const handleLaunchCompare = () => {
    if (selectedForCompare.length < 2) {
      alert('Please select at least 2 machines to compare.');
      return;
    }
    router.push(`/machines/compare?ids=${selectedForCompare.join(',')}`);
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.machine_id.toLowerCase().includes(search.toLowerCase()) ||
      (m.brand && m.brand.toLowerCase().includes(search.toLowerCase())) ||
      (m.model && m.model.toLowerCase().includes(search.toLowerCase())) ||
      m.machine_type.toLowerCase().includes(search.toLowerCase());

    const matchesSection = sectionFilter === 'All' || m.section_id === sectionFilter;
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;

    return matchesSearch && matchesSection && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Machine Asset Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete industrial asset registry of all {machines.length} production line machines and specifications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={handleLaunchCompare}
              className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-500 transition animate-pulse"
            >
              <GitCompare className="mr-1.5 h-4 w-4" />
              <span>Compare Selected ({selectedForCompare.length})</span>
            </button>
          )}

          <Link
            href="/admin?action=new-machine"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Add New Machine</span>
          </Link>
        </div>
      </div>

      {/* Filter and Selection Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Section Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Section:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            >
              <option value="All">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Inactive">Inactive</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Machine Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-10 text-center">Compare</th>
                <th className="py-3 px-4">Machine ID</th>
                <th className="py-3 px-4">Machine Name</th>
                <th className="py-3 px-4">Section & Line</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Brand & Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMachines.map((m) => {
                const sec = sections.find((s) => s.id === m.section_id);
                const isSelected = selectedForCompare.includes(m.id);

                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-blue-50/40 transition ${
                      isSelected ? 'bg-purple-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleCompare(m.id)}
                        className="text-slate-400 hover:text-purple-600 transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      <Link href={`/machines/${m.id}`} className="hover:underline">
                        {m.machine_id}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/machines/${m.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition"
                      >
                        {m.name}
                      </Link>
                      {m.process_name && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{m.process_name}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{sec?.name || '-'}</span>
                      <p className="text-[11px] text-slate-400">{m.line}</p>
                    </td>
                    <td className="py-3 px-4">{m.machine_type}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{m.brand || '-'}</span>
                      <p className="text-[11px] text-slate-400">{m.model || '-'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          m.status === 'Active'
                            ? 'success'
                            : m.status === 'Under Maintenance'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/machines/${m.id}`}
                        className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        <span>Asset Details</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredMachines.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No machines match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table summary footer */}
        <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
          <span>
            Showing {filteredMachines.length} of {machines.length} registered machines
          </span>
          {selectedForCompare.length > 0 && (
            <span className="text-purple-700 font-semibold">
              {selectedForCompare.length} selected for comparison
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
