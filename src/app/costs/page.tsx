'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Plus,
  Filter,
  Search,
  Download,
  PieChart as PieChartIcon,
  Layers,
  ArrowRight,
  Boxes,
  BarChart3,
  Wrench,
  Clock,
  Users,
  Zap,
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Cpu,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { store } from '../../lib/store';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { formatCurrencyBDT, formatNumber } from '../../lib/calculations';
import { exportToExcel } from '../../lib/excel';
import { ModelProcessCost } from '../../types';

export default function CostsPage() {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'model-cost' | 'plant-cost' | 'part-cost'>('model-cost');

  // Model-wise cost filters
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('model-cost-rac-24k');

  // Part cost filters
  const [partModelFilter, setPartModelFilter] = useState('All');
  const [partSearch, setPartSearch] = useState('');

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const modelProcessCosts = store.modelProcessCosts;
  const costRecords = store.costRecords;
  const partCosts = store.partCosts;
  const sections = store.sections;

  // Available Series list
  const seriesList = useMemo(() => {
    const list = Array.from(new Set(modelProcessCosts.map((m) => m.series))).filter(Boolean);
    return ['All', ...list];
  }, [modelProcessCosts]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return modelProcessCosts.filter((m) => {
      const matchSeries = selectedSeries === 'All' || m.series === selectedSeries;
      const matchSearch =
        m.model_code.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.capacity_ton.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.series.toLowerCase().includes(modelSearch.toLowerCase());
      return matchSeries && matchSearch;
    });
  }, [modelProcessCosts, selectedSeries, modelSearch]);

  // Currently selected model object
  const activeModel: ModelProcessCost | undefined = useMemo(() => {
    const found = modelProcessCosts.find((m) => m.id === selectedModelId);
    if (found) return found;
    return filteredModels[0] || modelProcessCosts[0];
  }, [modelProcessCosts, selectedModelId, filteredModels]);

  // Comparison Bar Chart data for current series
  const comparisonChartData = useMemo(() => {
    const subset =
      selectedSeries === 'All'
        ? modelProcessCosts.slice(0, 10)
        : modelProcessCosts.filter((m) => m.series === selectedSeries);

    return subset.map((m) => {
      let shortName = m.model_code.replace('Cassette ', 'WCM-').replace('Duct ', 'WDM-').replace('Ceiling ', 'WCLM-').replace('VRF Outdoor ', 'VRF-');
      if (shortName.length > 15) shortName = shortName.substring(0, 13) + '..';
      return {
        name: shortName,
        fullName: m.model_code,
        totalCost: Number(m.total_process_cost_bdt) || 0,
        manpowerCost: Number(m.manpower_cost_bdt) || 0,
        utilityCost: Number(m.utility_cost_bdt) || 0,
        mouldCost: Number(m.mould_tooling_cost_bdt) || 0,
      };
    });
  }, [modelProcessCosts, selectedSeries]);

  // Breakdown donut data for currently active model
  const activeModelDonutData = useMemo(() => {
    if (!activeModel) return [];
    return [
      { name: 'Manpower Cost', value: Number(activeModel.manpower_cost_bdt) || 0, color: '#3b82f6' },
      { name: 'Utility (Power & Air)', value: Number(activeModel.utility_cost_bdt) || 0, color: '#10b981' },
      { name: 'Mould & Tooling', value: Number(activeModel.mould_tooling_cost_bdt) || 0, color: '#f59e0b' },
      { name: 'Floor Space Area', value: Number(activeModel.area_cost_bdt) || 0, color: '#8b5cf6' },
    ].filter((d) => d.value > 0);
  }, [activeModel]);

  // Aggregate Plant Costs calculations
  const totalPlantCost = costRecords.reduce((sum, c) => sum + Number(c.cost_amount), 0);
  const categoryMap: Record<string, number> = {};
  costRecords.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + Number(c.cost_amount);
  });
  const categoryChartData = Object.entries(categoryMap).map(([cat, amount]) => ({
    name: cat,
    value: amount,
  }));

  // Part cost filtering
  const filteredPartCosts = partCosts.filter((p) => {
    const matchesModel = partModelFilter === 'All' || p.model_name === partModelFilter;
    const matchesSearch =
      p.part_name.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.model_name.toLowerCase().includes(partSearch.toLowerCase());
    return matchesModel && matchesSearch;
  });

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

  const handleExport = () => {
    exportToExcel('Walton_AC_Process_Costing_Data_Center', [
      {
        name: 'Model Wise Process Costs',
        columns: [
          { header: 'Model Code', key: 'model_code', width: 32 },
          { header: 'Series', key: 'series', width: 22 },
          { header: 'Capacity / Tonnage', key: 'capacity_ton', width: 20 },
          { header: 'Operations Count', key: 'operation_count', width: 16 },
          { header: 'Cycle Time (sec)', key: 'total_cycle_time_sec', width: 16 },
          { header: 'SAM (sec)', key: 'sam_sec', width: 14 },
          { header: 'Line Manpower', key: 'total_manpower', width: 14 },
          { header: 'Utility Cost (BDT)', key: 'utility_cost_bdt', width: 18 },
          { header: 'Manpower Cost (BDT)', key: 'manpower_cost_bdt', width: 18 },
          { header: 'Mould Cost (BDT)', key: 'mould_tooling_cost_bdt', width: 18 },
          { header: 'Area Cost (BDT)', key: 'area_cost_bdt', width: 16 },
          { header: 'Total Process Cost (BDT)', key: 'total_process_cost_bdt', width: 22 },
        ],
        data: modelProcessCosts,
      },
      {
        name: 'Plant Operating Costs',
        columns: [
          { header: 'Section', key: 'section_name', width: 25 },
          { header: 'Category', key: 'category', width: 18 },
          { header: 'Amount (BDT)', key: 'cost_amount', width: 18 },
          { header: 'Cost per Piece', key: 'cost_per_piece', width: 18 },
          { header: 'Period', key: 'period', width: 15 },
          { header: 'Remarks', key: 'remarks', width: 30 },
        ],
        data: costRecords.map((c) => ({
          section_name: sections.find((s) => s.id === c.section_id)?.name || c.section_id,
          ...c,
        })),
      },
      {
        name: 'Part Wise Costs',
        columns: [
          { header: 'AC Model', key: 'model_name', width: 25 },
          { header: 'Part Name', key: 'part_name', width: 25 },
          { header: 'SAM (sec)', key: 'sam_sec', width: 15 },
          { header: 'Quantity', key: 'quantity', width: 12 },
          { header: 'Unit Cost', key: 'unit_cost', width: 15 },
          { header: 'Process Cost', key: 'process_cost', width: 15 },
        ],
        data: filteredPartCosts,
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-800">
              Walton IE Data Center
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">17 Production Models</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase mt-1">
            Model Process Cost & Economics Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Engineered process costing, utility load, observed manpower SAM, and operation breakdowns extracted from Walton AC production records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin?tab=costs"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Wrench className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Edit in Admin
          </Link>
          <button
            onClick={handleExport}
            className="inline-flex items-center rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export Cost Matrix (.xlsx)
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Model Process Cost"
          value={activeModel ? formatCurrencyBDT(activeModel.total_process_cost_bdt) : '0 BDT'}
          subtitle={activeModel ? activeModel.model_code : 'Select a model'}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Engineered Operations"
          value={activeModel ? formatNumber(activeModel.operation_count) + ' Ops' : '0 Ops'}
          subtitle="Machine & manual tasks"
          icon={Layers}
          color="amber"
        />
        <StatCard
          title="Standard Allowed Minutes (SAM)"
          value={activeModel ? `${(activeModel.sam_sec / 60).toFixed(1)} min` : '0 min'}
          subtitle={activeModel ? `${activeModel.sam_sec} seconds per unit` : ''}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Total Plant Overhead"
          value={formatCurrencyBDT(totalPlantCost)}
          subtitle="Monthly factory baseline"
          icon={Building2}
          color="emerald"
        />
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('model-cost')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'model-cost'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Model Process Cost Data Center ({modelProcessCosts.length} Models)</span>
        </button>

        <button
          onClick={() => setActiveTab('plant-cost')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'plant-cost'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Monthly Plant Operating Costs ({costRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('part-cost')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'part-cost'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Component Part Cost Breakdown ({partCosts.length})</span>
        </button>
      </div>

      {/* TAB 1: MODEL PROCESS COST DATA CENTER */}
      {activeTab === 'model-cost' && (
        <div className="space-y-6">
          {/* Series Filter & Search Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Series Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Series:
                </span>
                {seriesList.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeries(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                      selectedSeries === s
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search model code, tonnage..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Quick Model Selector Pills */}
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Quick Select:
              </span>
              {filteredModels.map((m) => {
                const isSelected = activeModel?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition flex items-center space-x-1.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{m.model_code}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({formatCurrencyBDT(m.total_process_cost_bdt)})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE MODEL SPOTLIGHT CARD */}
          {activeModel && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="info" className="uppercase font-bold text-[10px]">
                      {activeModel.series}
                    </Badge>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">
                      Tonnage: {activeModel.capacity_ton}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                    {activeModel.model_code}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Source File: <span className="font-mono text-slate-600">{activeModel.source_file}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Engineered Cost
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                      {formatCurrencyBDT(activeModel.total_process_cost_bdt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5 Specific Cost Parameter Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Direct Manpower</span>
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formatCurrencyBDT(activeModel.manpower_cost_bdt)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {activeModel.total_manpower} Persons Line
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Utility Power & Air</span>
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formatCurrencyBDT(activeModel.utility_cost_bdt)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Electricity & Air compressor
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
                  <div className="flex items-center justify-between text-amber-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Mould & Tooling</span>
                    <Wrench className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formatCurrencyBDT(activeModel.mould_tooling_cost_bdt)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Die & tooling amortization
                  </div>
                </div>

                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5">
                  <div className="flex items-center justify-between text-purple-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Floor Space Cost</span>
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formatCurrencyBDT(activeModel.area_cost_bdt)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Factory footprint allocation
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Observed SAM</span>
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {(activeModel.sam_sec / 60).toFixed(1)} min
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Cycle: {activeModel.total_cycle_time_sec} sec
                  </div>
                </div>
              </div>

              {/* Two Visual Charts: Cost Breakdown Donut & Comparative Series Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Donut Chart */}
                <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Cost Structure Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Proportional cost elements</p>
                  </div>

                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeModelDonutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={68}
                          paddingAngle={3}
                        >
                          {activeModelDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => [formatCurrencyBDT(Number(val)), 'Cost']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3">
                    {activeModelDonutData.map((d) => {
                      const pct = activeModel.total_process_cost_bdt
                        ? ((d.value / activeModel.total_process_cost_bdt) * 100).toFixed(1)
                        : '0';
                      return (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center text-slate-600">
                            <span
                              className="h-2 w-2 rounded-full mr-2"
                              style={{ backgroundColor: d.color }}
                            />
                            {d.name}
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatCurrencyBDT(d.value)}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Series Comparative Bar Chart */}
                <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Process Cost Comparison ({selectedSeries === 'All' ? 'Top Models' : selectedSeries})
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">BDT per Unit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Relative cost scaling across production capacities
                    </p>
                  </div>

                  <div className="h-56 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          angle={-15}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                        />
                        <Tooltip
                          formatter={(val: any) => [formatCurrencyBDT(Number(val)), 'Total Cost']}
                          labelFormatter={(label, payload) => {
                            const found = payload && payload[0]?.payload?.fullName;
                            return found || label;
                          }}
                        />
                        <Bar dataKey="totalCost" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>*Values reflect Walton AC Industrial Engineering observed time & cost studies.</span>
                    <span className="font-semibold text-blue-600">
                      {comparisonChartData.length} Models Plotted
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Operations Table (If operations_sample is present) */}
              {activeModel.operations_sample && activeModel.operations_sample.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Engineered Operations Breakdown: {activeModel.model_code}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Showing sequence of observed factory operations, machines, and cycle times
                      </p>
                    </div>
                    <Badge variant="default" className="font-mono text-[10px]">
                      {activeModel.operations_sample.length} Operations Displayed
                    </Badge>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Section</th>
                          <th className="py-2.5 px-3">Operation Description</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Cycle (s)</th>
                          <th className="py-2.5 px-3 text-right">Cap/Hr</th>
                          <th className="py-2.5 px-3 text-right">Manpower</th>
                          <th className="py-2.5 px-3 text-right">Power (kW)</th>
                          <th className="py-2.5 px-3 text-right">Air (m³/h)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {activeModel.operations_sample.map((op, idx) => (
                          <tr key={op.id || idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 text-[11px] font-semibold text-slate-800">
                              {op.section}
                            </td>
                            <td className="py-2 px-3 text-slate-900 font-semibold">{op.operation_name}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  op.machine_manual === 'Machine'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {op.machine_manual}
                                {op.machine_tag ? ` (#${op.machine_tag})` : ''}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {op.cycle_time_sec}s
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {op.capacity_per_hr || '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-800">
                              {op.manpower}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {op.kwh ? `${op.kwh} kW` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {op.air_m3_h ? `${op.air_m3_h}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPLETE MASTER MODEL COMPARISON TABLE */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Master Model Process Cost Directory ({filteredModels.length} Models)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Full industrial engineering comparative matrix across all Walton air conditioner models
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="info" className="font-mono text-[10px]">
                  Series: {selectedSeries}
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100/70 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Model Code</th>
                    <th className="py-3 px-3">Series</th>
                    <th className="py-3 px-3">Tonnage</th>
                    <th className="py-3 px-3 text-right">Ops</th>
                    <th className="py-3 px-3 text-right">Cycle (s)</th>
                    <th className="py-3 px-3 text-right">SAM (s)</th>
                    <th className="py-3 px-3 text-right">Manpower</th>
                    <th className="py-3 px-3 text-right">Utility (BDT)</th>
                    <th className="py-3 px-3 text-right">Manpower (BDT)</th>
                    <th className="py-3 px-3 text-right">Tooling (BDT)</th>
                    <th className="py-3 px-4 text-right">Total Cost (BDT)</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredModels.map((m) => {
                    const isSelected = activeModel?.id === m.id;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedModelId(m.id)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                          <span>{m.model_code}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {m.series}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{m.capacity_ton}</td>
                        <td className="py-3 px-3 text-right font-mono">{m.operation_count}</td>
                        <td className="py-3 px-3 text-right font-mono">{m.total_cycle_time_sec}s</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">{m.sam_sec}s</td>
                        <td className="py-3 px-3 text-right font-mono">{m.total_manpower}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700">
                          {formatCurrencyBDT(m.utility_cost_bdt)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-blue-700">
                          {formatCurrencyBDT(m.manpower_cost_bdt)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-700">
                          {formatCurrencyBDT(m.mould_tooling_cost_bdt)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          {formatCurrencyBDT(m.total_process_cost_bdt)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModelId(m.id);
                            }}
                            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY PLANT OPERATIONAL COSTS */}
      {activeTab === 'plant-cost' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Donut */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-900">Cost Category Distribution</h3>
                <p className="text-xs text-slate-500">Proportional expenditure breakdown</p>
              </div>
              <div className="h-56 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrencyBDT(Number(val)), 'Cost']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-3">
                {categoryChartData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center">
                      <span
                        className="h-2.5 w-2.5 rounded-full mr-2"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      {c.name}
                    </span>
                    <span className="font-bold text-slate-900">{formatCurrencyBDT(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Operational Overhead Entries
                </h3>
                <Link
                  href="/admin?tab=costs"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
                >
                  Manage Costs
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-right">Monthly Amount</th>
                      <th className="py-3 px-3 text-right">Cost / Pc</th>
                      <th className="py-3 px-3">Period</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {costRecords.map((c) => {
                      const sec = sections.find((s) => s.id === c.section_id);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {sec?.name || c.section_id}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                              {c.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrencyBDT(c.cost_amount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {c.cost_per_piece ? formatCurrencyBDT(c.cost_per_piece) : '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-500">{c.period}</td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.remarks || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PART-WISE COMPONENT COSTS */}
      {activeTab === 'part-cost' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Model:</span>
              <select
                value={partModelFilter}
                onChange={(e) => setPartModelFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="All">All AC Models</option>
                {Array.from(new Set(partCosts.map((p) => p.model_name))).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search component parts..."
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Model Name</th>
                    <th className="py-3 px-4">Component Part</th>
                    <th className="py-3 px-3 text-right">SAM (sec)</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Part Unit Cost</th>
                    <th className="py-3 px-3 text-right">Direct Process Cost</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPartCosts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.model_name}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{p.part_name}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-blue-700">{p.sam_sec}s</td>
                      <td className="py-3 px-3 text-right font-mono">{p.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrencyBDT(p.unit_cost)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrencyBDT(p.process_cost)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
