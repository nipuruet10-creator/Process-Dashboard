'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Grid,
  Cpu,
  CheckCircle2,
  Workflow,
  Gauge,
  Timer,
  DollarSign,
  ArrowUpRight,
  Plus,
  Search,
  ChevronRight,
  Layers,
  AlertTriangle,
  Factory,
  Download,
  Filter,
  Check,
  Zap,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sliders,
  ChevronDown,
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
  Legend,
  CartesianGrid,
} from 'recharts';
import { store } from '../lib/store';
import { Badge } from '../components/ui/Badge';
import { formatCurrencyBDT, formatNumber } from '../lib/calculations';
import { exportToExcel } from '../lib/excel';
import { Section, Machine, Process, CapacityRecord, CostRecord, SAMRecord } from '../types';

export default function DashboardPage() {
  const [, setTick] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [explorerTab, setExplorerTab] = useState<'matrix' | 'costs' | 'capacity' | 'sam' | 'machines'>('matrix');
  const [explorerSearch, setExplorerSearch] = useState<string>('');

  useEffect(() => {
    store.init();
    const unsubscribe = store.subscribe(() => setTick((t) => t + 1));
    return unsubscribe;
  }, []);

  const sections = store.sections;
  const machines = store.machines;
  const processes = store.processes;
  const capacityRecords = store.capacityRecords;
  const costRecords = store.costRecords;
  const samRecords = store.samRecords;

  // -------------------------------------------------------------
  // KPI Calculations
  // -------------------------------------------------------------
  const totalSections = sections.length;
  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => m.status === 'Active').length;
  const totalProcesses = processes.length;

  const totalDailyCapacity = useMemo(() => {
    return capacityRecords.reduce((sum, r) => sum + (Number(r.daily_capacity) || 0), 0);
  }, [capacityRecords]);

  const totalMonthlyShiftCapacity = useMemo(() => {
    return capacityRecords.reduce((sum, r) => sum + (Number(r.shift_capacity) || 0), 0);
  }, [capacityRecords]);

  const avgSAMSec = useMemo(() => {
    if (!processes.length) return 0;
    const total = processes.reduce((sum, p) => sum + (Number(p.sam_sec) || 0), 0);
    return Number((total / processes.length).toFixed(1));
  }, [processes]);

  const totalMonthlyCost = useMemo(() => {
    return costRecords.reduce((sum, c) => sum + (Number(c.cost_amount) || 0), 0);
  }, [costRecords]);

  // Active section for the Spotlight Module
  const activeSection = useMemo(() => {
    if (selectedSectionId === 'all') return sections[0] || null;
    return sections.find((s) => s.id === selectedSectionId) || sections[0] || null;
  }, [sections, selectedSectionId]);

  // Section data helper
  const getSectionData = (secId: string) => {
    const secMachines = machines.filter((m) => m.section_id === secId);
    const secProcesses = processes.filter((p) => p.section_id === secId);
    const secCapRec = capacityRecords.find((c) => c.section_id === secId);
    const secCosts = costRecords.filter((c) => c.section_id === secId);
    const secSAMs = samRecords.filter((s) => s.section_id === secId);

    const totalCostAmount = secCosts.reduce((sum, c) => sum + (Number(c.cost_amount) || 0), 0);
    const totalCostPerPiece = secCosts.reduce((sum, c) => sum + (Number(c.cost_per_piece) || 0), 0);
    const avgSecSAM = secProcesses.length
      ? Number((secProcesses.reduce((sum, p) => sum + (Number(p.sam_sec) || 0), 0) / secProcesses.length).toFixed(1))
      : 0;

    return {
      machines: secMachines,
      processes: secProcesses,
      capacity: secCapRec,
      costs: secCosts,
      sams: secSAMs,
      totalCostAmount,
      totalCostPerPiece,
      avgSecSAM,
    };
  };

  const activeSecData = activeSection ? getSectionData(activeSection.id) : null;

  // -------------------------------------------------------------
  // Chart Data
  // -------------------------------------------------------------
  // Capacity vs SAM chart across sections
  const capacityChartData = useMemo(() => {
    return sections.map((sec) => {
      const cap = capacityRecords.find((c) => c.section_id === sec.id);
      const data = getSectionData(sec.id);
      return {
        code: sec.code.replace('SEC-', ''),
        name: sec.name,
        shiftGross: cap ? Number(cap.machine_capacity_hr) * 7.75 : 500,
        shiftEffective: cap ? Number(cap.shift_capacity) : 350,
        samSec: data.avgSecSAM,
      };
    });
  }, [sections, capacityRecords]);

  // Cost Distribution Pie Data
  const costCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    costRecords.forEach((c) => {
      map[c.category] = (map[c.category] || 0) + Number(c.cost_amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [costRecords]);

  const PIE_COLORS = ['#082B52', '#0B3A70', '#F5A900', '#B89B73', '#146C43', '#5B95C7', '#C47E00'];

  // -------------------------------------------------------------
  // Master Explorer Filtering & Export
  // -------------------------------------------------------------
  const filteredSectionsForExplorer = useMemo(() => {
    if (!explorerSearch.trim()) return sections;
    const q = explorerSearch.toLowerCase();
    return sections.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.responsible_person && s.responsible_person.toLowerCase().includes(q))
    );
  }, [sections, explorerSearch]);

  const handleExportExplorer = () => {
    if (explorerTab === 'matrix') {
      const data = sections.map((sec) => {
        const d = getSectionData(sec.id);
        return {
          'Section Code': sec.code,
          'Section Name': sec.name,
          'Responsible IE': sec.responsible_person || 'N/A',
          'Total Machines': d.machines.length,
          'Hourly Speed': d.capacity ? d.capacity.machine_capacity_hr : 'N/A',
          'Effective Shift Cap': d.capacity ? d.capacity.shift_capacity : 'N/A',
          'Daily Capacity': d.capacity ? d.capacity.daily_capacity : 'N/A',
          'Avg SAM (sec)': d.avgSecSAM,
          'Cost Per Piece (৳)': d.totalCostPerPiece.toFixed(2),
          'Monthly Cost (৳)': d.totalCostAmount,
          Status: sec.status,
        };
      });
      exportToExcel('Walton_AC_Section_Matrix', [{ name: 'Section Matrix', data, columns: [] }]);
    } else if (explorerTab === 'costs') {
      const data = costRecords.map((c) => {
        const sec = sections.find((s) => s.id === c.section_id);
        return {
          Section: sec ? `${sec.code} - ${sec.name}` : c.section_id,
          Category: c.category,
          'Cost Amount (৳)': c.cost_amount,
          'Cost Per Piece (৳)': c.cost_per_piece,
          Period: c.period,
          Remarks: c.remarks || '',
        };
      });
      exportToExcel('Walton_AC_Process_Costs', [{ name: 'Process Costs', data, columns: [] }]);
    } else if (explorerTab === 'capacity') {
      const data = capacityRecords.map((cap) => {
        const sec = sections.find((s) => s.id === cap.section_id);
        return {
          Section: sec ? `${sec.code} - ${sec.name}` : cap.section_id,
          'Machine Rated/hr': cap.machine_capacity_hr,
          'Shift Gross (7.75h)': Number(cap.machine_capacity_hr) * 7.75,
          'IE Rating (%)': cap.efficiency_pct,
          'Effective Shift Capacity': cap.shift_capacity,
          'Daily Capacity': cap.daily_capacity,
          'Monthly Capacity': cap.monthly_capacity,
          Remarks: cap.remarks || '',
        };
      });
      exportToExcel('Walton_AC_Plant_Capacity', [{ name: 'Capacity', data, columns: [] }]);
    } else if (explorerTab === 'sam') {
      const data = processes.map((p) => {
        const sec = sections.find((s) => s.id === p.section_id);
        return {
          Section: sec ? sec.code : 'N/A',
          'Process Name': p.name,
          'Cycle Time (sec)': p.cycle_time_sec,
          'SAM (sec)': p.sam_sec,
          'SAM (min)': (p.sam_sec / 60).toFixed(2),
          Manpower: p.manpower || 1,
          'Process Cost (৳)': p.process_cost || 0,
          Remarks: p.remarks || '',
        };
      });
      exportToExcel('Walton_AC_SAM_Engineering', [{ name: 'SAM Records', data, columns: [] }]);
    } else {
      const data = machines.map((m) => {
        const sec = sections.find((s) => s.id === m.section_id);
        return {
          'Machine ID': m.machine_id,
          'Machine Name': m.name,
          Section: sec ? sec.code : m.section_id,
          Brand: m.brand || m.manufacturer || 'N/A',
          Type: m.machine_type,
          Line: m.line || 'Main Line',
          Status: m.status,
        };
      });
      exportToExcel('Walton_AC_All_Machines', [{ name: 'Machines', data, columns: [] }]);
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-14 text-[#172B3A]">
      {/* -------------------------------------------------------------
          1. Perspective / Operational Truth Audit Banner
          ------------------------------------------------------------- */}
      <div className="perspective-banner">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#D98F00] animate-pulse"></span>
          <div>
            <strong className="text-[#082B52]">Process Development Division</strong>
            <span className="mx-1.5 text-[#B56F00]">•</span>
            <span>Plant-Wide Engineering Truth Audit (2026 Production Baseline)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="badge-tag badge-mfc">12 Sections Active</span>
          <span className="badge-tag badge-cu">70% – 85% IE Rating</span>
          <span className="badge-tag badge-status-ok">
            <Check className="h-3 w-3 inline mr-1" /> Shift: 7.75h Effective
          </span>
          <span className="badge-tag bg-blue-50 text-[#082B52] border border-blue-200">Currency: BDT (৳)</span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. KPI Metric Cards Grid (5 Cards - Exact Reference Theme)
          ------------------------------------------------------------- */}
      <section className="kpi-grid">
        {/* Total Sections */}
        <div className="kpi-card accent-blue">
          <div className="kpi-title">
            <Grid className="h-4 w-4" />
            Total Plant Sections
          </div>
          <div className="kpi-value">{totalSections} Lines</div>
          <div className="kpi-subtext">Verified Walton RAC Assembly & Fabrication</div>
        </div>

        {/* Total Machines */}
        <div className="kpi-card accent-amber">
          <div className="kpi-title">
            <Cpu className="h-4 w-4" />
            Total Machines Tracked
          </div>
          <div className="kpi-value text-[#D98F00]">{totalMachines} Units</div>
          <div className="kpi-subtext">
            <span className="kpi-badge badge-mfc">
              {activeMachines} Active ({Math.round((activeMachines / (totalMachines || 1)) * 100)}% uptime)
            </span>
          </div>
        </div>

        {/* Total Plant Daily Capacity */}
        <div className="kpi-card accent-emerald">
          <div className="kpi-title">
            <Gauge className="h-4 w-4" />
            Total Daily Capacity
          </div>
          <div className="kpi-value text-[#146C43]">{formatNumber(totalDailyCapacity)} pcs</div>
          <div className="kpi-subtext">
            <span className="kpi-badge badge-status-ok">
              {formatNumber(totalMonthlyShiftCapacity)} pcs / 7.75h Shift
            </span>
          </div>
        </div>

        {/* Line Average SAM */}
        <div className="kpi-card accent-copper">
          <div className="kpi-title">
            <Timer className="h-4 w-4" />
            Line Average SAM
          </div>
          <div className="kpi-value text-[#82633D]">{avgSAMSec}s</div>
          <div className="kpi-subtext">
            <span className="kpi-badge badge-cu">{(avgSAMSec / 60).toFixed(2)} min | Takt: 48s</span>
          </div>
        </div>

        {/* Monthly Line Process Cost */}
        <div className="kpi-card accent-subtle">
          <div className="kpi-title">
            <DollarSign className="h-4 w-4" />
            Monthly Process Cost
          </div>
          <div className="kpi-value text-[#0B3A70]">৳ {formatNumber(totalMonthlyCost)}</div>
          <div className="kpi-subtext">Direct Manpower, Utilities & Tooling</div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. SECTION-WISE SEGREGATED COMMAND CENTER ("Section Spotlight")
          "Section wise alada hobe, then every section er process cost,
           capacity, SAM, machine details thakbe."
          ------------------------------------------------------------- */}
      <section className="bg-white rounded-xl border border-[#E1E5E8] shadow-sm p-6 space-y-6">
        {/* Section Selector Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E1E5E8] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F5A900]"></span>
              <h2 className="text-lg font-extrabold text-[#082B52] uppercase tracking-tight">
                Section-Wise Industrial Engineering Command Center
              </h2>
            </div>
            <p className="text-xs text-[#536778] mt-1">
              Click any section pill below to isolate its 4 core engineering pillars: Machine Details, Process Cost, Shift Capacity, and Standard Allowed Minutes (SAM).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sections"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0B3A70] bg-[#E7F0F7] border border-[#B8CCDE] hover:bg-[#D5E6F5] transition"
            >
              <span>View All 12 Sections Matrix</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Section Filter Chips / Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedSectionId('all')}
            className={`filter-chip whitespace-nowrap ${selectedSectionId === 'all' ? 'active' : ''}`}
          >
            All Sections Spotlight
          </button>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              className={`filter-chip whitespace-nowrap flex items-center gap-1.5 ${
                selectedSectionId === sec.id ? 'active' : ''
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">{sec.code}</span>
              <span>{sec.name}</span>
            </button>
          ))}
        </div>

        {/* 4-Pillar Executive Quadrant for Selected Section */}
        {activeSection && activeSecData && (
          <div className="bg-[#FAF9F5] rounded-xl border border-[#E1E5E8] p-5 space-y-5">
            {/* Active Section Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#E1E5E8]">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-[#082B52] text-white font-mono font-bold text-xs tracking-wider">
                  {activeSection.code}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#082B52] leading-tight">
                    {activeSection.name}
                  </h3>
                  <p className="text-xs text-[#536778]">
                    In-Charge: <strong className="text-[#172B3A]">{activeSection.responsible_person || 'ESM Department'}</strong>
                    <span className="mx-2">•</span>
                    Target OEE: <strong className="text-[#146C43]">{activeSection.target_oee || 88}%</strong>
                    <span className="mx-2">•</span>
                    Line Speed: <strong className="text-[#0B3A70]">{activeSection.line_speed || '45 units/hr'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={activeSection.status === 'Active' ? 'success' : 'warning'}>
                  {activeSection.status}
                </Badge>
                <Link
                  href={`/sections/${activeSection.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#0B3A70] hover:bg-[#082B52] transition shadow-2xs"
                >
                  <span>Full Section Spec</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* The 4 Dedicated Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* =========================================
                  PILLAR 1: MACHINE DETAILS
                  ========================================= */}
              <div className="bg-white rounded-lg border border-[#E1E5E8] border-t-3 border-t-[#082B52] p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#082B52]">
                      <Cpu className="h-4 w-4 text-[#082B52]" />
                      <span>1. Machine Details</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#082B52] border border-blue-200">
                      {activeSecData.machines.length} Units
                    </span>
                  </div>

                  <p className="text-xs text-[#536778] mb-3">
                    Production assets deployed on this specific manufacturing line:
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeSecData.machines.length > 0 ? (
                      activeSecData.machines.map((m) => (
                        <div
                          key={m.id}
                          className="p-2 rounded bg-[#FAF9F5] border border-[#EBEEF0] text-xs space-y-1 hover:border-[#CBD3D9] transition"
                        >
                          <div className="flex items-center justify-between font-semibold text-[#082B52]">
                            <span className="font-mono text-[11px] bg-white px-1.5 py-0.2 border border-slate-200 rounded">
                              {m.machine_id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {m.status}
                            </span>
                          </div>
                          <div className="font-medium text-[#172B3A] line-clamp-1">{m.name}</div>
                          <div className="text-[11px] text-[#536778] flex items-center justify-between">
                            <span>Supplier: <strong className="text-[#082B52]">{m.brand || m.manufacturer || 'Walton Inhouse'}</strong></span>
                            <span>{m.machine_type}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No individual machines registered yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#EBEEF0] text-[11px] text-[#536778] flex items-center justify-between">
                  <span>ESM Maintenance Active</span>
                  <Link href="/machines" className="text-[#0B3A70] font-bold hover:underline">
                    View Registry →
                  </Link>
                </div>
              </div>

              {/* =========================================
                  PILLAR 2: PROCESS COST
                  ========================================= */}
              <div className="bg-white rounded-lg border border-[#E1E5E8] border-t-3 border-t-[#F5A900] p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#082B52]">
                      <DollarSign className="h-4 w-4 text-[#F5A900]" />
                      <span>2. Process Cost</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF4D6] text-[#8A5A00] border border-[#F0D28A]">
                      ৳ {activeSecData.totalCostPerPiece.toFixed(2)} / pc
                    </span>
                  </div>

                  <p className="text-xs text-[#536778] mb-3">
                    Model & section cost components (Direct Labor, Energy, Consumables):
                  </p>

                  <div className="space-y-2">
                    {activeSecData.costs.length > 0 ? (
                      activeSecData.costs.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-2 rounded bg-[#FAF9F5] border border-[#EBEEF0] text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#172B3A]">{c.category}</span>
                            <div className="text-[10px] text-[#536778] line-clamp-1">{c.remarks}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#082B52]">৳ {formatNumber(c.cost_amount)}</div>
                            <div className="text-[10px] text-[#8A5A00] font-semibold">৳ {c.cost_per_piece}/pc</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Cost structure configured on model bills.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#EBEEF0] flex items-center justify-between text-xs">
                  <span className="text-[#536778]">Total Monthly Cost:</span>
                  <span className="font-extrabold text-[#082B52]">
                    ৳ {formatNumber(activeSecData.totalCostAmount)}
                  </span>
                </div>
              </div>

              {/* =========================================
                  PILLAR 3: PLANT CAPACITY
                  ========================================= */}
              <div className="bg-white rounded-lg border border-[#E1E5E8] border-t-3 border-t-[#146C43] p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#082B52]">
                      <Gauge className="h-4 w-4 text-[#146C43]" />
                      <span>3. Capacity</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5EE] text-[#146C43] border border-[#B7DEC9]">
                      7.75h Shift Rated
                    </span>
                  </div>

                  <p className="text-xs text-[#536778] mb-3">
                    Output capability under standard industrial engineering shifts:
                  </p>

                  {activeSecData.capacity ? (
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-[#FAF9F5] border border-[#EBEEF0] flex items-center justify-between text-xs">
                        <span className="text-[#536778]">Hourly Machine Speed:</span>
                        <strong className="text-[#082B52]">
                          {activeSecData.capacity.machine_capacity_hr} units / hr
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#FAF9F5] border border-[#EBEEF0] flex items-center justify-between text-xs">
                        <span className="text-[#536778]">7.75h Shift Gross Output:</span>
                        <strong className="text-[#082B52]">
                          {formatNumber(Math.round(Number(activeSecData.capacity.machine_capacity_hr) * 7.75))} pcs
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#E8F5EE] border border-[#B7DEC9] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#146C43]">Effective Shift @ {activeSecData.capacity.efficiency_pct}%:</span>
                        <strong className="text-[#146C43] font-black text-sm">
                          {formatNumber(activeSecData.capacity.shift_capacity)} pcs
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#FAF9F5] border border-[#EBEEF0] flex items-center justify-between text-xs">
                        <span className="text-[#536778]">Daily Capacity (2-Shift):</span>
                        <strong className="text-[#082B52]">
                          {formatNumber(activeSecData.capacity.daily_capacity)} pcs / day
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Standard pace: 50 units/hr.
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-[#EBEEF0] flex items-center justify-between text-xs">
                  <span className="text-[#536778]">Monthly Capacity:</span>
                  <strong className="text-[#146C43]">
                    {activeSecData.capacity ? `${formatNumber(activeSecData.capacity.monthly_capacity)} pcs` : 'N/A'}
                  </strong>
                </div>
              </div>

              {/* =========================================
                  PILLAR 4: SAM & WORKSTATIONS
                  ========================================= */}
              <div className="bg-white rounded-lg border border-[#E1E5E8] border-t-3 border-t-[#B89B73] p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#082B52]">
                      <Timer className="h-4 w-4 text-[#B89B73]" />
                      <span>4. SAM & Stations</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F8F3EC] text-[#82633D] border border-[#E1D2BD]">
                      Avg: {activeSecData.avgSecSAM}s
                    </span>
                  </div>

                  <p className="text-xs text-[#536778] mb-3">
                    Standard Allowed Minutes & engineered operator cycle times:
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeSecData.processes.length > 0 ? (
                      activeSecData.processes.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 rounded bg-[#FAF9F5] border border-[#EBEEF0] text-xs space-y-1"
                        >
                          <div className="font-semibold text-[#172B3A] line-clamp-1">{p.name}</div>
                          <div className="flex items-center justify-between text-[11px] text-[#536778]">
                            <span>Cycle: <strong className="text-[#082B52]">{p.cycle_time_sec}s</strong></span>
                            <span>SAM: <strong className="text-[#82633D]">{p.sam_sec}s ({(p.sam_sec / 60).toFixed(2)}m)</strong></span>
                            <span>Headcount: <strong>{p.manpower || 1} op</strong></span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Process steps configured in line routing.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#EBEEF0] flex items-center justify-between text-xs">
                  <span className="text-[#536778]">Total Station SAM:</span>
                  <span className="font-extrabold text-[#82633D]">
                    {activeSecData.processes.reduce((sum, p) => sum + (Number(p.sam_sec) || 0), 0)}s (
                    {(activeSecData.processes.reduce((sum, p) => sum + (Number(p.sam_sec) || 0), 0) / 60).toFixed(2)}m)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          4. Full-Width Charts: Section Comparison (Shift Output vs SAM)
          ------------------------------------------------------------- */}
      <section className="bg-white rounded-xl border border-[#E1E5E8] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E5E8] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#082B52]"></span>
              <h3 className="text-base font-bold text-[#082B52] uppercase tracking-wide">
                Plant-Wide Section Output vs Cycle SAM Benchmark
              </h3>
            </div>
            <p className="text-xs text-[#536778]">
              Comparison of 7.75h Effective Shift Capacity (pieces) against Average Process Cycle Time (seconds).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-[#082B52]"></span> Effective Shift Output (pcs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-[#F5A900]"></span> Avg SAM (sec)
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityChartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9EC" />
              <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#536778', fontWeight: 600 }} angle={-15} textAnchor="end" />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#536778' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#D98F00' }} unit="s" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#082B52',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  border: '1px solid #124B83',
                }}
                formatter={(val: any, name: any) => [
                  name === 'shiftEffective' ? `${formatNumber(Number(val))} pcs` : `${val} seconds`,
                  name === 'shiftEffective' ? 'Effective Shift Output' : 'Average SAM',
                ]}
                labelFormatter={(label, payload) => (payload[0] ? payload[0].payload.name : label)}
              />
              <Bar yAxisId="left" dataKey="shiftEffective" fill="#082B52" radius={[4, 4, 0, 0]} barSize={26} />
              <Bar yAxisId="right" dataKey="samSec" fill="#F5A900" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. Master Comparative Section Explorer (Tabbed Data Module)
          ------------------------------------------------------------- */}
      <section className="explorer-card space-y-5">
        {/* Explorer Header */}
        <div className="tabs-header">
          <div>
            <h3 className="text-base font-extrabold text-[#082B52] uppercase tracking-wide">
              Master Section Comparative Data Center
            </h3>
            <p className="text-xs text-[#536778] mt-0.5">
              Comprehensive factory tables with search, live filtering, and one-click Excel export.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search line, machine, process..."
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                className="search-input pl-9"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportExplorer}
              className="btn-export"
              title="Export active table to Excel spreadsheet"
            >
              <Download className="h-4 w-4 text-[#F5A900]" />
              <span>Export CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tab-nav border-b border-[#EBEEF0] pb-2">
          <button
            onClick={() => setExplorerTab('matrix')}
            className={`tab-btn ${explorerTab === 'matrix' ? 'active' : ''}`}
          >
            <Grid className="h-4 w-4" />
            <span>1. Section Summary Matrix</span>
          </button>
          <button
            onClick={() => setExplorerTab('costs')}
            className={`tab-btn ${explorerTab === 'costs' ? 'active' : ''}`}
          >
            <DollarSign className="h-4 w-4" />
            <span>2. Process Cost Center</span>
          </button>
          <button
            onClick={() => setExplorerTab('capacity')}
            className={`tab-btn ${explorerTab === 'capacity' ? 'active' : ''}`}
          >
            <Gauge className="h-4 w-4" />
            <span>3. Capacity & Shift Output</span>
          </button>
          <button
            onClick={() => setExplorerTab('sam')}
            className={`tab-btn ${explorerTab === 'sam' ? 'active' : ''}`}
          >
            <Timer className="h-4 w-4" />
            <span>4. SAM & Labor Allocation</span>
          </button>
          <button
            onClick={() => setExplorerTab('machines')}
            className={`tab-btn ${explorerTab === 'machines' ? 'active' : ''}`}
          >
            <Cpu className="h-4 w-4" />
            <span>5. All Plant Assets ({machines.length})</span>
          </button>
        </div>

        {/* Tab 1: Section Summary Matrix */}
        {explorerTab === 'matrix' && (
          <div className="table-container">
            <table className="walton-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Section Name</th>
                  <th>Responsible IE</th>
                  <th className="text-center">Machines</th>
                  <th className="text-right">Hourly Rated</th>
                  <th className="text-right">Effective Shift</th>
                  <th className="text-right">Daily Capacity</th>
                  <th className="text-right">Avg SAM</th>
                  <th className="text-right">Cost / Piece</th>
                  <th className="text-right">Monthly Cost</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSectionsForExplorer.map((sec) => {
                  const d = getSectionData(sec.id);
                  return (
                    <tr key={sec.id}>
                      <td className="font-mono font-bold text-[#082B52]">{sec.code}</td>
                      <td className="font-semibold text-[#172B3A]">{sec.name}</td>
                      <td className="text-xs text-[#536778]">{sec.responsible_person || 'ESM Department'}</td>
                      <td className="text-center font-bold text-[#082B52]">{d.machines.length} Units</td>
                      <td className="text-right font-mono">
                        {d.capacity ? `${d.capacity.machine_capacity_hr}/hr` : '—'}
                      </td>
                      <td className="text-right font-mono font-bold text-[#146C43]">
                        {d.capacity ? `${formatNumber(d.capacity.shift_capacity)} pcs` : '—'}
                      </td>
                      <td className="text-right font-mono text-[#082B52]">
                        {d.capacity ? `${formatNumber(d.capacity.daily_capacity)} pcs` : '—'}
                      </td>
                      <td className="text-right font-mono font-semibold text-[#82633D]">
                        {d.avgSecSAM}s
                      </td>
                      <td className="text-right font-mono font-bold text-[#D98F00]">
                        ৳ {d.totalCostPerPiece.toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-[#082B52]">
                        ৳ {formatNumber(d.totalCostAmount)}
                      </td>
                      <td className="text-center">
                        <span className="badge-status-ok">{sec.status}</span>
                      </td>
                      <td className="text-center">
                        <Link
                          href={`/sections/${sec.id}`}
                          className="text-[#0B3A70] hover:underline font-bold text-xs"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {/* Summary Row */}
                <tr className="table-total-row">
                  <td colSpan={3} className="font-bold text-[#082B52]">
                    TOTAL PLANT PRODUCTION LINES ({sections.length} SECTIONS)
                  </td>
                  <td className="text-center font-bold text-[#082B52]">{totalMachines} Units</td>
                  <td className="text-right font-mono">—</td>
                  <td className="text-right font-mono font-extrabold text-[#146C43]">
                    {formatNumber(totalMonthlyShiftCapacity)} pcs
                  </td>
                  <td className="text-right font-mono font-extrabold text-[#082B52]">
                    {formatNumber(totalDailyCapacity)} pcs
                  </td>
                  <td className="text-right font-mono font-bold text-[#82633D]">{avgSAMSec}s</td>
                  <td className="text-right font-mono font-bold text-[#D98F00]">—</td>
                  <td className="text-right font-mono font-extrabold text-[#082B52]">
                    ৳ {formatNumber(totalMonthlyCost)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Process Cost Center */}
        {explorerTab === 'costs' && (
          <div className="table-container">
            <table className="walton-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Category</th>
                  <th className="text-right">Cost Amount</th>
                  <th className="text-right">Cost Per Piece</th>
                  <th>Period</th>
                  <th>Remarks / Cost Drivers</th>
                </tr>
              </thead>
              <tbody>
                {costRecords.map((c) => {
                  const sec = sections.find((s) => s.id === c.section_id);
                  return (
                    <tr key={c.id}>
                      <td className="font-bold text-[#082B52]">
                        {sec ? `${sec.code} - ${sec.name}` : c.section_id}
                      </td>
                      <td className="font-semibold text-[#172B3A]">{c.category}</td>
                      <td className="text-right font-mono font-bold text-[#082B52]">
                        ৳ {formatNumber(c.cost_amount)}
                      </td>
                      <td className="text-right font-mono text-[#D98F00] font-bold">
                        ৳ {c.cost_per_piece} / pc
                      </td>
                      <td>{c.period}</td>
                      <td className="text-xs text-[#536778]">{c.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Capacity Matrix */}
        {explorerTab === 'capacity' && (
          <div className="table-container">
            <table className="walton-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th className="text-right">Machine Rated Speed</th>
                  <th className="text-right">7.75h Shift Gross</th>
                  <th className="text-center">IE Rating</th>
                  <th className="text-right">Effective Shift Output</th>
                  <th className="text-right">Daily Capacity</th>
                  <th className="text-right">Monthly Output</th>
                  <th>Engineering Shift Model</th>
                </tr>
              </thead>
              <tbody>
                {capacityRecords.map((cap) => {
                  const sec = sections.find((s) => s.id === cap.section_id);
                  return (
                    <tr key={cap.id}>
                      <td className="font-bold text-[#082B52]">
                        {sec ? `${sec.code} - ${sec.name}` : cap.section_id}
                      </td>
                      <td className="text-right font-mono">{cap.machine_capacity_hr} units / hr</td>
                      <td className="text-right font-mono text-[#536778]">
                        {formatNumber(Math.round(Number(cap.machine_capacity_hr) * 7.75))} pcs
                      </td>
                      <td className="text-center">
                        <span className="badge-tag badge-cu">{cap.efficiency_pct}% IE Rating</span>
                      </td>
                      <td className="text-right font-mono font-bold text-[#146C43]">
                        {formatNumber(cap.shift_capacity)} pcs
                      </td>
                      <td className="text-right font-mono font-bold text-[#082B52]">
                        {formatNumber(cap.daily_capacity)} pcs
                      </td>
                      <td className="text-right font-mono font-bold text-[#082B52]">
                        {formatNumber(cap.monthly_capacity)} pcs
                      </td>
                      <td className="text-xs text-[#536778]">{cap.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: SAM Engineering */}
        {explorerTab === 'sam' && (
          <div className="table-container">
            <table className="walton-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Process Operation</th>
                  <th className="text-right">Cycle Time</th>
                  <th className="text-right">SAM (sec)</th>
                  <th className="text-right">SAM (min)</th>
                  <th className="text-center">Headcount</th>
                  <th className="text-right">Process Cost</th>
                  <th>Quality / Control Parameters</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => {
                  const sec = sections.find((s) => s.id === p.section_id);
                  return (
                    <tr key={p.id}>
                      <td className="font-mono font-bold text-[#082B52]">{sec ? sec.code : '—'}</td>
                      <td className="font-semibold text-[#172B3A]">{p.name}</td>
                      <td className="text-right font-mono">{p.cycle_time_sec}s</td>
                      <td className="text-right font-mono font-bold text-[#82633D]">{p.sam_sec}s</td>
                      <td className="text-right font-mono text-[#536778]">{(p.sam_sec / 60).toFixed(2)}m</td>
                      <td className="text-center font-bold text-[#082B52]">{p.manpower || 1} op</td>
                      <td className="text-right font-mono text-[#D98F00] font-bold">
                        ৳ {p.process_cost || 0}
                      </td>
                      <td className="text-xs text-[#536778]">{p.critical_parameters || p.quality_check}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: All Machines */}
        {explorerTab === 'machines' && (
          <div className="table-container">
            <table className="walton-table">
              <thead>
                <tr>
                  <th>Machine ID</th>
                  <th>Machine Name</th>
                  <th>Section</th>
                  <th>Supplier / Brand</th>
                  <th>Type</th>
                  <th>Line / Sub-process</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const sec = sections.find((s) => s.id === m.section_id);
                  return (
                    <tr key={m.id}>
                      <td className="font-mono font-bold text-[#082B52]">{m.machine_id}</td>
                      <td className="font-semibold text-[#172B3A]">{m.name}</td>
                      <td className="text-xs font-mono text-[#536778]">{sec ? sec.code : m.section_id}</td>
                      <td>
                        <strong className="text-[#082B52]">{m.brand || m.manufacturer || 'Walton'}</strong>
                      </td>
                      <td>{m.machine_type}</td>
                      <td className="text-xs text-[#536778]">{m.line || m.process_name}</td>
                      <td className="text-center">
                        <span className="badge-status-ok">{m.status}</span>
                      </td>
                      <td className="text-center">
                        <Link
                          href={`/machines/${m.id}`}
                          className="text-[#0B3A70] hover:underline font-bold text-xs"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          6. Footer & Engineering Credential
          ------------------------------------------------------------- */}
      <footer className="dashboard-footer text-xs text-[#536778] flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E1E5E8] pt-4">
        <div>
          <span>Walton Air Conditioner Manufacturing Complex | </span>
          <strong className="text-[#082B52]">Process Development & Industrial Engineering</strong>
        </div>
        <div className="flex items-center gap-2">
          <span>Admin Credential: <code>admin</code></span>
          <span>•</span>
          <span>Version: <code>2026.3-PROD</code></span>
        </div>
      </footer>
    </div>
  );
}
