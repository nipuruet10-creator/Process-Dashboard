'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { store } from '../../../lib/store';
import { Badge } from '../../../components/ui/Badge';
import { Machine } from '../../../types';

function MachineCompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, setTick] = useState(0);

  const initialIds = (searchParams.get('ids') || '').split(',').filter(Boolean);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const allMachines = store.machines;
  const sections = store.sections;
  const customFields = store.customFields.filter((cf) => cf.target_entity === 'machine');

  // If no IDs were in URL, select the first two machines by default
  useEffect(() => {
    if (selectedIds.length === 0 && allMachines.length >= 2) {
      setSelectedIds([allMachines[0].id, allMachines[1].id]);
    }
  }, [allMachines, selectedIds]);

  const selectedMachines = selectedIds
    .map((id) => allMachines.find((m) => m.id === id))
    .filter(Boolean) as Machine[];

  const handleAddMachine = (id: string) => {
    if (selectedIds.length >= 4) {
      alert('You can compare up to 4 machines simultaneously.');
      return;
    }
    if (!selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemoveMachine = (id: string) => {
    setSelectedIds(selectedIds.filter((mId) => mId !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/machines" className="hover:text-blue-600 flex items-center">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Machines
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">Machine Comparison</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Side-by-Side Machine Comparison
          </h1>
          <p className="text-xs text-slate-500">
            Compare industrial performance, specifications, power rating, and parameters across 2 to 4 machines.
          </p>
        </div>

        {/* Machine Selector Dropdown */}
        {selectedMachines.length < 4 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Add Machine:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddMachine(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="" disabled>
                Select machine to add...
              </option>
              {allMachines
                .filter((m) => !selectedIds.includes(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_id} - {m.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Comparison Grid Table */}
      {selectedMachines.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-4 px-6 w-60 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    Specification / Metric
                  </th>
                  {selectedMachines.map((m) => (
                    <th key={m.id} className="py-4 px-6 min-w-[220px]">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {m.machine_id}
                          </span>
                          <h4 className="mt-1 font-extrabold text-sm text-slate-900 leading-snug">
                            {m.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-normal">{m.brand} {m.model}</p>
                        </div>
                        {selectedMachines.length > 1 && (
                          <button
                            onClick={() => handleRemoveMachine(m.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-1"
                            title="Remove from comparison"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Status */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-6 font-bold text-slate-900 bg-slate-50/50">Status</td>
                  {selectedMachines.map((m) => (
                    <td key={m.id} className="py-3 px-6">
                      <Badge variant={m.status === 'Active' ? 'success' : 'warning'} size="sm">
                        {m.status}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Section & Line */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-6 font-bold text-slate-900 bg-slate-50/50">Section & Line</td>
                  {selectedMachines.map((m) => {
                    const sec = sections.find((s) => s.id === m.section_id);
                    return (
                      <td key={m.id} className="py-3 px-6">
                        <span className="font-bold text-slate-800">{sec?.name || '-'}</span>
                        <p className="text-[11px] text-slate-400">{m.line}</p>
                      </td>
                    );
                  })}
                </tr>

                {/* Machine Type */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-6 font-bold text-slate-900 bg-slate-50/50">Machine Type</td>
                  {selectedMachines.map((m) => (
                    <td key={m.id} className="py-3 px-6 font-medium">
                      {m.machine_type}
                    </td>
                  ))}
                </tr>

                {/* Manufacturer */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-6 font-bold text-slate-900 bg-slate-50/50">Manufacturer</td>
                  {selectedMachines.map((m) => (
                    <td key={m.id} className="py-3 px-6">
                      {m.manufacturer || '-'}
                    </td>
                  ))}
                </tr>

                {/* Serial Number */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-6 font-bold text-slate-900 bg-slate-50/50">Serial Number</td>
                  {selectedMachines.map((m) => (
                    <td key={m.id} className="py-3 px-6 font-mono">
                      {m.serial_number || '-'}
                    </td>
                  ))}
                </tr>

                {/* Installation Date */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-6 font-bold text-slate-900 bg-slate-50/50">Installation Date</td>
                  {selectedMachines.map((m) => (
                    <td key={m.id} className="py-3 px-6">
                      {m.installation_date || '-'}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Custom Fields */}
                {customFields.map((field) => (
                  <tr key={field.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-bold text-slate-900 bg-slate-50/50">
                      {field.field_name} {field.unit && <span className="text-slate-400 font-normal">({field.unit})</span>}
                    </td>
                    {selectedMachines.map((m) => {
                      const vals = store.getFieldValuesForEntity('machine', m.id);
                      const val = vals[field.field_key];
                      return (
                        <td key={m.id} className="py-3 px-6 font-semibold text-slate-800">
                          {val !== undefined && val !== '' ? (
                            <span>
                              {String(val)} {field.unit}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center border rounded-2xl bg-white">
          <GitCompare className="mx-auto h-12 w-12 text-slate-300 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No machines selected</h3>
          <p className="text-xs text-slate-500 mt-1">Select machines to begin side-by-side comparison.</p>
        </div>
      )}
    </div>
  );
}

export default function MachineComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading machine comparison...</div>}>
      <MachineCompareContent />
    </Suspense>
  );
}
