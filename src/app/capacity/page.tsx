'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Gauge,
  Sliders,
  RotateCcw,
  Download,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Wrench,
  Zap,
  Cpu,
  Layers as LayersIcon,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { store } from '../../lib/store';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { calculateCapacity, formatNumber } from '../../lib/calculations';
import { exportToExcel } from '../../lib/excel';

export default function CapacityPage() {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'fin-capacity' | 'forecast' | 'technical-matrix' | 'simulator'>('fin-capacity');

  // Filters for Fin Press Capacity
  const [productFilter, setProductFilter] = useState<string>('All');

  // Filters for Matrix Specs
  const [matrixDiaFilter, setMatrixDiaFilter] = useState<string>('All');
  const [matrixTonnageFilter, setMatrixTonnageFilter] = useState<string>('All');
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  // Simulation inputs
  const [machineCapacityHr, setMachineCapacityHr] = useState<number>(89.7); // Walton Fin Press baseline
  const [workingHours, setWorkingHours] = useState<number>(7.75); // Real Walton factory shift
  const [shifts, setShifts] = useState<number>(2);
  const [efficiency, setEfficiency] = useState<number>(70); // Real IE rating
  const [manpower, setManpower] = useState<number>(18);

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const finPressCapacities = store.finPressCapacities;
  const productionForecast = store.productionForecast;
  const heatExchangerMatrix = store.heatExchangerMatrix;

  // Filtered Fin Capacities
  const filteredFinCapacities = useMemo(() => {
    return finPressCapacities.filter((c) => {
      if (productFilter === 'All') return true;
      return c.product.toLowerCase().includes(productFilter.toLowerCase());
    });
  }, [finPressCapacities, productFilter]);

  // Chart data for Fin Press Capacity
  const finCapacityChartData = useMemo(() => {
    return filteredFinCapacities.map((c) => ({
      name: c.model.length > 14 ? c.model.substring(0, 12) + '..' : c.model,
      fullName: `${c.product} - ${c.model}`,
      grossShift: c.gross_shift_cap,
      effectiveShift: c.effective_shift_cap,
      capPerHour: c.capacity_per_hr,
    }));
  }, [filteredFinCapacities]);

  // 12-Month Forecast Annual Calculations
  const forecastTotals = useMemo(() => {
    const totalCoils = productionForecast.reduce((sum, f) => sum + (f.total_coils || 0), 0);
    const totalMfc = productionForecast.reduce((sum, f) => sum + (f.condenser_mfc || 0), 0);
    const totalCu = productionForecast.reduce((sum, f) => sum + (f.condenser_copper || 0), 0);
    const totalEva5mm = productionForecast.reduce((sum, f) => sum + (f.evaporator_5mm || 0), 0);
    const totalEva7mm = productionForecast.reduce((sum, f) => sum + (f.evaporator_7mm || 0), 0);
    const peakMonth = [...productionForecast].sort((a, b) => b.total_coils - a.total_coils)[0];

    return {
      totalCoils,
      totalMfc,
      totalCu,
      totalEva5mm,
      totalEva7mm,
      peakMonthName: peakMonth ? peakMonth.month : 'Peak Season',
      peakMonthVal: peakMonth ? peakMonth.total_coils : 0,
      avgMonthly: Math.round(totalCoils / (productionForecast.length || 1)),
    };
  }, [productionForecast]);

  // Filtered Matrix specifications
  const filteredMatrix = useMemo(() => {
    return heatExchangerMatrix.filter((m) => {
      const matchDia = matrixDiaFilter === 'All' || m.tube_dia.includes(matrixDiaFilter);
      const matchTon = matrixTonnageFilter === 'All' || m.capacity.toUpperCase().includes(matrixTonnageFilter.toUpperCase());
      const matchSearch =
        m.part_name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        m.capacity.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        (m.fin_configuration && m.fin_configuration.toLowerCase().includes(matrixSearch.toLowerCase())) ||
        (m.series && m.series.toLowerCase().includes(matrixSearch.toLowerCase()));
      return matchDia && matchTon && matchSearch;
    });
  }, [heatExchangerMatrix, matrixDiaFilter, matrixTonnageFilter, matrixSearch]);

  // Simulator result calculation
  const simResult = calculateCapacity({
    machineCapacityPerHour: machineCapacityHr,
    workingHours,
    shiftCount: shifts,
    efficiencyPct: efficiency,
  });

  const handleExport = () => {
    exportToExcel('Walton_AC_Capacity_Engineering_Matrix', [
      {
        name: 'Fin Press & Coil Capacities',
        columns: [
          { header: 'Product', key: 'product', width: 20 },
          { header: 'Machine Name', key: 'machine', width: 28 },
          { header: 'Type / Spec', key: 'type', width: 22 },
          { header: 'Model Coil', key: 'model', width: 20 },
          { header: 'Cycle Time (s)', key: 'cycle_time_sec', width: 15 },
          { header: 'Hourly Cap (pcs/hr)', key: 'capacity_per_hr', width: 20 },
          { header: 'Shift Hours (h)', key: 'shift_hours', width: 15 },
          { header: 'Efficiency %', key: 'efficiency_pct', width: 14 },
          { header: 'Gross Shift Cap', key: 'gross_shift_cap', width: 16 },
          { header: 'Effective Shift Cap', key: 'effective_shift_cap', width: 18 },
        ],
        data: finPressCapacities,
      },
      {
        name: '12-Month Coil Demand Forecast',
        columns: [
          { header: 'Month', key: 'month', width: 15 },
          { header: 'Condenser MFC', key: 'condenser_mfc', width: 18 },
          { header: 'Condenser Copper', key: 'condenser_copper', width: 18 },
          { header: 'Evaporator 5mm', key: 'evaporator_5mm', width: 18 },
          { header: 'Evaporator 7mm', key: 'evaporator_7mm', width: 18 },
          { header: 'Total Coils', key: 'total_coils', width: 18 },
        ],
        data: productionForecast,
      },
      {
        name: '5mm & 7mm Technical Matrix',
        columns: [
          { header: 'Capacity', key: 'capacity', width: 12 },
          { header: 'Series', key: 'series', width: 15 },
          { header: 'Part Name', key: 'part_name', width: 18 },
          { header: 'Tube Dia', key: 'tube_dia', width: 12 },
          { header: 'Tube Wall Thk', key: 'tube_thickness', width: 18 },
          { header: 'Hairpins', key: 'hairpin_count', width: 18 },
          { header: 'Hairpin Length', key: 'hairpin_length', width: 18 },
          { header: 'Fin Thk (mm)', key: 'fin_thickness', width: 14 },
          { header: 'Hole Count', key: 'hole_count', width: 14 },
          { header: 'Fin Pattern', key: 'fin_configuration', width: 18 },
          { header: 'Fin Quantity', key: 'fin_quantity', width: 16 },
        ],
        data: heatExchangerMatrix,
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800">
              Walton IE Data Center
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Standard 7.75h Shifts @ 70% IE Efficiency</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase mt-1">
            Plant Capacity & Heat Exchanger Engineering
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real production parameters for High-Speed Fin Presses (HSFP-01, HSFP-03), Hairpin Benders, 12-Month Coil Forecasts, and 5mm/7mm Technical Matrices.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export Capacity Matrix (.xlsx)
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fin Press Shift Baseline"
          value="7.75 Hours"
          subtitle="Net productive shift time"
          icon={Gauge}
          color="blue"
        />
        <StatCard
          title="Standard Line Efficiency"
          value="70.0%"
          subtitle="Walton IE benchmark rating"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Annual Coil Production Target"
          value={formatNumber(forecastTotals.totalCoils)}
          subtitle={`Peak Month: ${forecastTotals.peakMonthName} (${formatNumber(forecastTotals.peakMonthVal)})`}
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Technical Matrix Specs"
          value={`${heatExchangerMatrix.length} Models`}
          subtitle="5mm & 7mm Fin-Tube geometry"
          icon={Layers}
          color="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs overflow-x-auto">
        {[
          { id: 'fin-capacity', label: `Fin Press & Coil Capacities (${finPressCapacities.length})`, icon: Gauge },
          { id: 'forecast', label: `12-Month Coil Demand Forecast (${productionForecast.length} Mo)`, icon: Calendar },
          { id: 'technical-matrix', label: `5mm & 7mm Technical Matrix (${heatExchangerMatrix.length})`, icon: Layers },
          { id: 'simulator', label: 'Dynamic IE Shift Simulator', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FIN PRESS & COIL SHIFT CAPACITY MATRIX */}
      {activeTab === 'fin-capacity' && (
        <div className="space-y-6">
          {/* Header Controls & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Product:</span>
              {['All', 'Evaporator', 'Condenser'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductFilter(cat)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    productFilter === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredFinCapacities.length}</span> verified production configurations
            </div>
          </div>

          {/* Comparative Capacity Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Effective Shift Capacity Comparison (pcs / 7.75h Shift @ 70% Efficiency)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Gross output vs effective factory output factoring IE allowances & tool changeover
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center text-slate-600">
                  <span className="h-3 w-3 rounded-xs bg-slate-300 mr-1.5" /> Gross Shift
                </span>
                <span className="flex items-center text-slate-600">
                  <span className="h-3 w-3 rounded-xs bg-blue-600 mr-1.5" /> Effective (70%)
                </span>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finCapacityChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} pcs`,
                      name === 'effectiveShift' ? 'Effective Shift (70%)' : 'Gross Shift Output',
                    ]}
                    labelFormatter={(label, payload) => {
                      const found = payload && payload[0]?.payload?.fullName;
                      return found || label;
                    }}
                  />
                  <Bar dataKey="grossShift" fill="#cbd5e1" radius={[3, 3, 0, 0]} name="Gross Shift" />
                  <Bar dataKey="effectiveShift" fill="#2563eb" radius={[3, 3, 0, 0]} name="effectiveShift" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Master Capacity Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Fin Press & Heat Exchanger Capacity Matrix
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cycle times, nominal rates, and shift capacities based on engineering time studies
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3">Equipment / Machine</th>
                    <th className="py-3 px-3">Type Specification</th>
                    <th className="py-3 px-3">Model Coil</th>
                    <th className="py-3 px-3 text-right">Cycle (sec)</th>
                    <th className="py-3 px-3 text-right">Cap / Hr</th>
                    <th className="py-3 px-3 text-right">Shift (h)</th>
                    <th className="py-3 px-3 text-right">Gross Shift</th>
                    <th className="py-3 px-4 text-right">Effective Shift (70%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredFinCapacities.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.product === 'Evaporator'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.product}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{c.machine}</td>
                      <td className="py-3 px-3 text-slate-600">{c.type}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{c.model}</td>
                      <td className="py-3 px-3 text-right font-mono">{c.cycle_time_sec}s</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {c.capacity_per_hr}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{c.shift_hours}h</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{c.gross_shift_cap} pcs</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-blue-700 bg-blue-50/40">
                        {c.effective_shift_cap} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12-MONTH COIL PRODUCTION DEMAND FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Forecast KPI Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Annual Coil Target
              </span>
              <span className="text-2xl font-black text-slate-900">
                {formatNumber(forecastTotals.totalCoils)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Total Coils (July - June)</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-1">
                Condenser Demand
              </span>
              <span className="text-2xl font-black text-blue-700">
                {formatNumber(forecastTotals.totalMfc + forecastTotals.totalCu)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                MFC: {formatNumber(forecastTotals.totalMfc)} | Cu: {formatNumber(forecastTotals.totalCu)}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">
                Evaporator Demand
              </span>
              <span className="text-2xl font-black text-emerald-700">
                {formatNumber(forecastTotals.totalEva5mm + forecastTotals.totalEva7mm)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                5mm: {formatNumber(forecastTotals.totalEva5mm)} | 7mm: {formatNumber(forecastTotals.totalEva7mm)}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">
                Monthly Average
              </span>
              <span className="text-2xl font-black text-slate-900">
                {formatNumber(forecastTotals.avgMonthly)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Coils / Month baseline</span>
            </div>
          </div>

          {/* 12-Month Stacked Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  12-Month Coil Production Demand Schedule (July - June)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Stacked distribution: Condenser MFC, Condenser Copper, Evaporator 5mm & 7mm
                </p>
              </div>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionForecast} margin={{ top: 15, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: any) => [`${formatNumber(Number(val))} coils`, 'Demand']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="condenser_mfc" name="Condenser MFC" stackId="coils" fill="#3b82f6" />
                  <Bar dataKey="condenser_copper" name="Condenser Copper" stackId="coils" fill="#f59e0b" />
                  <Bar dataKey="evaporator_5mm" name="Evaporator 5mm" stackId="coils" fill="#10b981" />
                  <Bar dataKey="evaporator_7mm" name="Evaporator 7mm" stackId="coils" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Monthly Coil Demand Breakdown
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-3 text-right">Condenser MFC</th>
                    <th className="py-3 px-3 text-right">Condenser Copper</th>
                    <th className="py-3 px-3 text-right">Evaporator 5mm</th>
                    <th className="py-3 px-3 text-right">Evaporator 7mm</th>
                    <th className="py-3 px-4 text-right">Total Month Coils</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {productionForecast.map((f) => (
                    <tr key={f.month} className="hover:bg-slate-50 font-medium">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{f.month}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                        {formatNumber(f.condenser_mfc)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                        {formatNumber(f.condenser_copper)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                        {formatNumber(f.evaporator_5mm)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-700">
                        {formatNumber(f.evaporator_7mm)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                        {formatNumber(f.total_coils)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 5MM & 7MM TECHNICAL MATRIX SPECIFICATIONS */}
      {activeTab === 'technical-matrix' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Tube Dia:
              </span>
              {['All', '5mm', '7mm'].map((dia) => (
                <button
                  key={dia}
                  onClick={() => setMatrixDiaFilter(dia)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    matrixDiaFilter === dia
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dia}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mx-2">
                Tonnage:
              </span>
              {['All', '12K', '18K', '24K'].map((ton) => (
                <button
                  key={ton}
                  onClick={() => setMatrixTonnageFilter(ton)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    matrixTonnageFilter === ton
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ton}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search geometry, fin count..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Matrix Specifications Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  5mm & 7mm Heat Exchanger Geometry Specifications ({filteredMatrix.length} Entries)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Official Walton technical engineering drawing parameters for hairpin tubes, collars, and fins
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Capacity</th>
                    <th className="py-3 px-3">Part Name</th>
                    <th className="py-3 px-2">Tube Dia</th>
                    <th className="py-3 px-3">Tube Wall (mm)</th>
                    <th className="py-3 px-3">Hairpin Count</th>
                    <th className="py-3 px-3">Hairpin Length</th>
                    <th className="py-3 px-2">Fin Thk</th>
                    <th className="py-3 px-2 text-center">Holes</th>
                    <th className="py-3 px-3">Pattern</th>
                    <th className="py-3 px-3">Fin Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredMatrix.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {m.capacity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{m.part_name}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.tube_dia.includes('5') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.tube_dia}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{m.tube_thickness || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-900">{m.hairpin_count || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{m.hairpin_length || '-'}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-600">{m.fin_thickness || '-'}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">{m.hole_count || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{m.fin_configuration || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-700 font-semibold">{m.fin_quantity || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DYNAMIC IE SHIFT SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
              Line Capacity Simulation Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive mathematical model: Hourly = Nominal Cap × Efficiency | Daily = Hourly × Hours × Shifts | Monthly = Daily × 26 Days
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Input Controls */}
            <div className="space-y-5 bg-slate-50/70 p-6 rounded-xl border border-slate-200/80">
              {/* Slider 1: Machine Speed */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Nominal Machine Speed:</span>
                  <span className="text-blue-600 font-mono">{machineCapacityHr} pcs / hour</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="250"
                  step="5"
                  value={machineCapacityHr}
                  onChange={(e) => setMachineCapacityHr(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Slider 2: Shift Hours */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Working Hours per Shift:</span>
                  <span className="text-blue-600 font-mono">{workingHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="12"
                  step="0.25"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Slider 3: Shifts */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Operating Shifts:</span>
                  <span className="text-blue-600 font-mono">{shifts} Shifts / Day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={shifts}
                  onChange={(e) => setShifts(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Slider 4: Efficiency */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Target Line Efficiency (OEE):</span>
                  <span className="text-emerald-600 font-mono">{efficiency}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={efficiency}
                  onChange={(e) => setEfficiency(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    setMachineCapacityHr(89.7);
                    setWorkingHours(7.75);
                    setShifts(2);
                    setEfficiency(70);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset to Walton Standard (7.75h @ 70%)
                </button>
              </div>
            </div>

            {/* Calculated Output Matrix */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                  Effective Hourly Output
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatNumber(simResult.hourlyCapacity)} <span className="text-xs font-medium text-slate-500">pcs/hr</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">@ {efficiency}% factory efficiency</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Shift Production
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatNumber(simResult.shiftCapacity)} <span className="text-xs font-medium text-slate-500">pcs/shift</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Net {workingHours} hours run</p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Daily Gross Output
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatNumber(simResult.dailyCapacity)} <span className="text-xs font-medium text-slate-500">pcs/day</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{shifts} operational shifts</p>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                  Monthly Plant Run
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatNumber(simResult.monthlyCapacity)} <span className="text-xs font-medium text-slate-500">pcs/month</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">26 operating days</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
