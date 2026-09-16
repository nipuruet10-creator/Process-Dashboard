'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Grid,
  Cpu,
  Workflow,
  DollarSign,
  Timer,
  Gauge,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ExternalLink,
  ChevronRight,
  Download,
  Info,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { store } from '../../../lib/store';
import { StatCard } from '../../../components/ui/StatCard';
import { Badge } from '../../../components/ui/Badge';
import {
  formatCurrencyBDT,
  formatNumber,
  calculateCapacity,
  calculateSAMMetrics,
} from '../../../lib/calculations';
import { exportToExcel } from '../../../lib/excel';

type ActiveTab = 'overview' | 'machines' | 'processes' | 'cost' | 'sam' | 'capacity' | 'documents';

export default function SectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;
  const [, setTick] = useState(0);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Capacity Simulator state
  const [simWorkingHours, setSimWorkingHours] = useState<number>(8);
  const [simShifts, setSimShifts] = useState<number>(2);
  const [simEfficiency, setSimEfficiency] = useState<number>(85);

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const section = store.sections.find((s) => s.id === sectionId);
  const machines = store.machines.filter((m) => m.section_id === sectionId);
  const processes = store.processes.filter((p) => p.section_id === sectionId);
  const samRecords = store.samRecords.filter((s) => s.section_id === sectionId);
  const capacityRecords = store.capacityRecords.filter((c) => c.section_id === sectionId);
  const costRecords = store.costRecords.filter((c) => c.section_id === sectionId);
  const documents = store.documents.filter(
    (d) => (d.entity_type === 'section' && d.entity_id === sectionId) ||
           (d.entity_type === 'machine' && machines.some((m) => m.id === d.entity_id))
  );

  if (!section) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Section Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested section identifier does not exist or has been removed.</p>
        <Link
          href="/sections"
          className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sections
        </Link>
      </div>
    );
  }

  // Aggregate Metrics
  const totalOperators = processes.reduce((sum, p) => sum + (p.manpower || 1), 0);
  const primaryCapacityRec = capacityRecords[0];
  const nominalHourlyCap = primaryCapacityRec ? Number(primaryCapacityRec.machine_capacity_hr) : 70;

  const simResult = calculateCapacity({
    machineCapacityPerHour: nominalHourlyCap,
    workingHours: simWorkingHours,
    shiftCount: simShifts,
    efficiencyPct: simEfficiency,
  });

  const samSummary = calculateSAMMetrics(processes, samRecords);
  const totalProcessCost = costRecords.reduce((sum, c) => sum + Number(c.cost_amount), 0);

  // Section export to Excel
  const handleExport = () => {
    exportToExcel(`Section_${section.code}_Report`, [
      {
        name: 'Machines',
        columns: [
          { header: 'Machine ID', key: 'machine_id', width: 15 },
          { header: 'Machine Name', key: 'name', width: 30 },
          { header: 'Type', key: 'machine_type', width: 20 },
          { header: 'Brand', key: 'brand', width: 15 },
          { header: 'Model', key: 'model', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
        ],
        data: machines,
      },
      {
        name: 'Processes',
        columns: [
          { header: 'Process Name', key: 'name', width: 30 },
          { header: 'Sub Process', key: 'sub_process', width: 20 },
          { header: 'Manpower', key: 'manpower', width: 12 },
          { header: 'SAM (sec)', key: 'sam_sec', width: 15 },
          { header: 'Cost (BDT)', key: 'process_cost', width: 15 },
        ],
        data: processes,
      },
    ]);
  };

  const tabs: { id: ActiveTab; label: string; count?: number; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Grid },
    { id: 'machines', label: 'Machines', count: machines.length, icon: Cpu },
    { id: 'processes', label: 'Processes', count: processes.length, icon: Workflow },
    { id: 'cost', label: 'Cost Breakdown', icon: DollarSign },
    { id: 'sam', label: 'SAM Analysis', icon: Timer },
    { id: 'capacity', label: 'Capacity Simulator', icon: Gauge },
    { id: 'documents', label: 'Documents & SOPs', count: documents.length, icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/sections" className="hover:text-blue-600 flex items-center">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Sections
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{section.name}</span>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
          Export Section Data
        </button>
      </div>

      {/* Section Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-mono font-bold text-white shadow-xs">
                {section.code}
              </span>
              <Badge variant={section.status === 'Active' ? 'success' : 'warning'}>
                {section.status}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                {section.department}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {section.name}
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              {section.description}
            </p>
            {section.responsible_person && (
              <p className="text-xs text-blue-700 font-semibold pt-1">
                Line In-Charge: {section.responsible_person}
              </p>
            )}
          </div>

          {section.photo_url && (
            <div className="relative h-28 w-44 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-xs hidden sm:block">
              <img src={section.photo_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Overview Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Machines</p>
          <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{machines.length}</h4>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {machines.filter((m) => m.status === 'Active').length} Operational
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Processes</p>
          <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{processes.length}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Line Stations</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Manpower</p>
          <h4 className="mt-1 text-2xl font-extrabold text-slate-900">{totalOperators}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Station Operators</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Capacity</p>
          <h4 className="mt-1 text-2xl font-extrabold text-blue-600">
            {formatNumber(simResult.dailyCapacity)}
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">pcs / day</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg SAM</p>
          <h4 className="mt-1 text-2xl font-extrabold text-amber-600">
            {samSummary.averageSAMSec} s
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Standard Cycle</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Process Cost</p>
          <h4 className="mt-1 text-xl font-extrabold text-slate-900">
            {formatCurrencyBDT(totalProcessCost)}
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Monthly Section</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Machine Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Section Machine Registry
                </h3>
                <p className="text-xs text-slate-500">Asset inventory assigned to this production line</p>
              </div>
              <Link
                href="/admin?action=new-machine"
                className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Machine
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Machine ID</th>
                    <th className="py-3 px-4">Machine Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Brand / Model</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {machines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{m.machine_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{m.name}</td>
                      <td className="py-3 px-4">{m.machine_type}</td>
                      <td className="py-3 px-4">
                        {m.brand} {m.model}
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
                          className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline"
                        >
                          View Details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {machines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No machines configured for this section yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Process Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Engineered Processes
                </h3>
                <p className="text-xs text-slate-500">Standard operating sequences and cycle allocations</p>
              </div>
              <Link
                href="/admin?action=new-process"
                className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Process
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Process Name</th>
                    <th className="py-3 px-4">Sub Process</th>
                    <th className="py-3 px-4">Cycle Time</th>
                    <th className="py-3 px-4">SAM</th>
                    <th className="py-3 px-4">Manpower</th>
                    <th className="py-3 px-4">Quality Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {processes.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-500">{p.sub_process || '-'}</td>
                      <td className="py-3 px-4 font-mono">{p.cycle_time_sec} s</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600">{p.sam_sec} s</td>
                      <td className="py-3 px-4 font-semibold">{p.manpower} op</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.quality_check || '-'}</td>
                    </tr>
                  ))}
                  {processes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No processes mapped for this section yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Machines Tab */}
      {activeTab === 'machines' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-900">
              All Machines ({machines.length})
            </h3>
            <Link
              href="/admin?action=new-machine"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Add Machine
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {machines.map((m) => (
              <div
                key={m.id}
                className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {m.machine_id}
                    </span>
                    <Badge variant={m.status === 'Active' ? 'success' : 'warning'} size="sm">
                      {m.status}
                    </Badge>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900">{m.name}</h4>
                  <p className="text-xs text-slate-500">{m.machine_type}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {m.brand} • Model: {m.model}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                  <Link
                    href={`/machines/${m.id}`}
                    className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Asset Record <ArrowLeft className="rotate-180 ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Processes Tab */}
      {activeTab === 'processes' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-900">
              Detailed Process Routing ({processes.length})
            </h3>
            <Link
              href="/admin?action=new-process"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Add Process
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {processes.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-700">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    {p.sub_process && (
                      <p className="text-xs font-medium text-slate-500">{p.sub_process}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">{p.description}</p>
                    {p.critical_parameters && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        Critical: {p.critical_parameters}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 text-xs">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">SAM</p>
                    <p className="font-mono font-bold text-amber-600 text-sm">{p.sam_sec} s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Manpower</p>
                    <p className="font-bold text-slate-800 text-sm">{p.manpower} op</p>
                  </div>
                  {p.sop_url && (
                    <a
                      href={p.sop_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-blue-600"
                      title="View SOP Document"
                    >
                      <FileText className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Cost Breakdown Tab */}
      {activeTab === 'cost' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-900">
                Operating Cost Structure ({section.name})
              </h3>
              <p className="text-xs text-slate-500">Breakdown across Manpower, Energy, Consumables & Maintenance</p>
            </div>
            <span className="text-base font-extrabold text-slate-900">
              Total: {formatCurrencyBDT(totalProcessCost)} / month
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {costRecords.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-800">{c.category}</span>
                    <p className="text-xs text-slate-400">{c.remarks || c.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-900">{formatCurrencyBDT(c.cost_amount)}</p>
                    <p className="text-[11px] text-slate-500">৳{c.cost_per_piece}/pc</p>
                  </div>
                </div>
              ))}
              {costRecords.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No cost records entered for this line.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 p-4 bg-slate-50 flex flex-col justify-center items-center">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Category Ratio</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costRecords}
                      dataKey="cost_amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                    >
                      {costRecords.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrencyBDT(Number(val)), 'Cost']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SAM Tab */}
      {activeTab === 'sam' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-900">
                Standard Allowed Minute (SAM) Breakdown
              </h3>
              <p className="text-xs text-slate-500">Station cycle balancing and bottleneck analysis</p>
            </div>
            <Badge variant="warning">Bottleneck: {samSummary.highestSAM.processName}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Average Line SAM</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{samSummary.averageSAMSec} sec</h4>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-[11px] font-bold text-rose-500 uppercase">Pace Bottleneck (Max)</p>
              <h4 className="text-2xl font-bold text-rose-700 mt-1">{samSummary.highestSAM.samSec} sec</h4>
              <p className="text-xs text-rose-600 truncate mt-0.5">{samSummary.highestSAM.processName}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-[11px] font-bold text-emerald-600 uppercase">Fastest Cycle (Min)</p>
              <h4 className="text-2xl font-bold text-emerald-800 mt-1">{samSummary.lowestSAM.samSec} sec</h4>
              <p className="text-xs text-emerald-700 truncate mt-0.5">{samSummary.lowestSAM.processName}</p>
            </div>
          </div>

          {/* Bar Chart of SAM per Process */}
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processes} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" angle={-20} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="s" />
                <Tooltip formatter={(val: any) => [`${val} sec`, 'SAM']} />
                <Bar dataKey="sam_sec" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6. Capacity Tab (Dynamic Simulator) */}
      {activeTab === 'capacity' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-900">
              Interactive Capacity Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Adjust working parameters to compute hourly, shift, daily, and monthly production outputs in real time.
            </p>
          </div>

          {/* Live Simulator Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Working Hours per Shift</span>
                <span className="text-blue-600">{simWorkingHours} Hours</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={simWorkingHours}
                onChange={(e) => setSimWorkingHours(Number(e.target.value))}
                className="w-full cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Shift Count</span>
                <span className="text-blue-600">{simShifts} Shifts / Day</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={simShifts}
                onChange={(e) => setSimShifts(Number(e.target.value))}
                className="w-full cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Line Efficiency Factor</span>
                <span className="text-emerald-600">{simEfficiency}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={simEfficiency}
                onChange={(e) => setSimEfficiency(Number(e.target.value))}
                className="w-full cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Output Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Hourly Output</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{simResult.hourlyCapacity}</h4>
              <p className="text-xs text-slate-500">pcs / hour</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Shift Output</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{simResult.shiftCapacity}</h4>
              <p className="text-xs text-slate-500">pcs / {simWorkingHours}h shift</p>
            </div>
            <div className="rounded-xl border border-blue-200 p-4 bg-blue-50/50 shadow-2xs">
              <p className="text-[11px] font-bold text-blue-700 uppercase">Daily Output</p>
              <h4 className="text-2xl font-black text-blue-800 mt-1">{formatNumber(simResult.dailyCapacity)}</h4>
              <p className="text-xs text-blue-600">{simShifts} shifts daily</p>
            </div>
            <div className="rounded-xl border border-emerald-200 p-4 bg-emerald-50/50 shadow-2xs">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Monthly Output</p>
              <h4 className="text-2xl font-black text-emerald-800 mt-1">{formatNumber(simResult.monthlyCapacity)}</h4>
              <p className="text-xs text-emerald-600">26 standard work days</p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Documents Tab */}
      {activeTab === 'documents' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-900">
                Attached Documents & Work Instructions
              </h3>
              <p className="text-xs text-slate-500">Approved technical documentation, plant layouts & SOPs</p>
            </div>
            <Link
              href="/admin?action=upload-doc"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Upload Document
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      Category: {doc.category} • Format: {doc.file_type} • Version: {doc.version}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center"
                >
                  <span>Open</span>
                  <ExternalLink className="ml-1 h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">
                No documents currently attached to this section.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
