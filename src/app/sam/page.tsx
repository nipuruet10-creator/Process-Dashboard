'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Timer,
  Plus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  Download,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { store } from '../../lib/store';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { calculateSAMMetrics } from '../../lib/calculations';
import { exportToExcel } from '../../lib/excel';

export default function SAMPage() {
  const [, setTick] = useState(0);
  const [sectionFilter, setSectionFilter] = useState('All');

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const processes = store.processes;
  const sections = store.sections;
  const machines = store.machines;
  const samRecords = store.samRecords;

  const filteredProcesses = processes.filter(
    (p) => sectionFilter === 'All' || p.section_id === sectionFilter
  );

  const samMetrics = calculateSAMMetrics(filteredProcesses, samRecords);

  const chartData = filteredProcesses.map((p) => ({
    name: p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name,
    fullName: p.name,
    sam: p.sam_sec,
    cycle: p.cycle_time_sec,
  }));

  const handleExport = () => {
    exportToExcel('SAM_Industrial_Engineering_Report', [
      {
        name: 'SAM Metrics',
        columns: [
          { header: 'Process Name', key: 'name', width: 30 },
          { header: 'Sub Process', key: 'sub_process', width: 20 },
          { header: 'SAM (sec)', key: 'sam_sec', width: 15 },
          { header: 'Cycle Time (sec)', key: 'cycle_time_sec', width: 18 },
          { header: 'Manpower', key: 'manpower', width: 12 },
          { header: 'Hourly Capacity', key: 'hourly_capacity', width: 16 },
        ],
        data: filteredProcesses,
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Standard Allowed Minute (SAM) Module
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Industrial engineering work-study analytics, station cycle timing, and bottleneck line balancing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Export SAM Report
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Line SAM"
          value={`${samMetrics.totalSAMSec} s`}
          subtitle="Complete factory line cycle"
          icon={Timer}
          color="blue"
        />
        <StatCard
          title="Average Station SAM"
          value={`${samMetrics.averageSAMSec} s`}
          subtitle="Average per operation"
          icon={Timer}
          color="indigo"
        />
        <StatCard
          title="Highest SAM (Bottleneck)"
          value={`${samMetrics.highestSAM.samSec} s`}
          subtitle={samMetrics.highestSAM.processName}
          icon={TrendingUp}
          color="rose"
        />
        <StatCard
          title="Lowest SAM (Fastest)"
          value={`${samMetrics.lowestSAM.samSec} s`}
          subtitle={samMetrics.lowestSAM.processName}
          icon={TrendingDown}
          color="emerald"
        />
      </div>

      {/* Chart: Process vs SAM */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-900">
              Process vs SAM & Cycle Time (Seconds)
            </h3>
            <p className="text-xs text-slate-500">Visual comparison of allocated SAM against nominal cycle time</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Section:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
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

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="s" />
              <Tooltip
                formatter={(value: any, name: any) => [`${value} sec`, name === 'sam' ? 'SAM' : 'Cycle Time']}
                labelFormatter={(label, payload) => (payload[0] ? payload[0].payload.fullName : label)}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend />
              <Bar dataKey="sam" fill="#0284c7" name="SAM (sec)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cycle" fill="#94a3b8" name="Cycle Time (sec)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed SAM Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            SAM Records & Station Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Process Name</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Machine Assigned</th>
                <th className="py-3 px-4">Operator / Manpower</th>
                <th className="py-3 px-4">Cycle Time</th>
                <th className="py-3 px-4">Allocated SAM</th>
                <th className="py-3 px-4">Output / Hour</th>
                <th className="py-3 px-4">Bottleneck Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProcesses.map((p) => {
                const sec = sections.find((s) => s.id === p.section_id);
                const mach = machines.find((m) => m.id === p.machine_id);
                const isMax = p.sam_sec === samMetrics.highestSAM.samSec;
                const isMin = p.sam_sec === samMetrics.lowestSAM.samSec;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4">{sec?.name || '-'}</td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold">
                      {mach ? `${mach.machine_id} - ${mach.name}` : 'Manual Station'}
                    </td>
                    <td className="py-3 px-4 font-semibold">{p.manpower} Operator</td>
                    <td className="py-3 px-4 font-mono">{p.cycle_time_sec} s</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{p.sam_sec} s</td>
                    <td className="py-3 px-4 font-mono">{p.hourly_capacity} pcs/hr</td>
                    <td className="py-3 px-4">
                      {isMax && <Badge variant="danger" size="sm">Line Bottleneck</Badge>}
                      {isMin && <Badge variant="success" size="sm">Fastest Cycle</Badge>}
                      {!isMax && !isMin && <span className="text-slate-400 font-normal">Normal</span>}
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
