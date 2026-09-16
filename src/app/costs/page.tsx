'use client';

import React, { useState, useEffect } from 'react';
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
} from 'recharts';
import { store } from '../../lib/store';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { formatCurrencyBDT, formatNumber } from '../../lib/calculations';
import { exportToExcel } from '../../lib/excel';

export default function CostsPage() {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'process-cost' | 'part-cost'>('process-cost');

  // Part cost filters
  const [modelFilter, setModelFilter] = useState('All');
  const [partSearch, setPartSearch] = useState('');

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const costRecords = store.costRecords;
  const partCosts = store.partCosts;
  const sections = store.sections;
  const processes = store.processes;

  // Aggregate calculations
  const totalPlantCost = costRecords.reduce((sum, c) => sum + Number(c.cost_amount), 0);

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  costRecords.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + Number(c.cost_amount);
  });
  const categoryChartData = Object.entries(categoryMap).map(([cat, amount]) => ({
    name: cat,
    value: amount,
  }));

  // Unique models for part-cost filter
  const models = Array.from(new Set(partCosts.map((p) => p.model_name)));

  const filteredPartCosts = partCosts.filter((p) => {
    const matchesModel = modelFilter === 'All' || p.model_name === modelFilter;
    const matchesSearch =
      p.part_name.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.model_name.toLowerCase().includes(partSearch.toLowerCase());
    return matchesModel && matchesSearch;
  });

  const totalPartWiseCost = filteredPartCosts.reduce((sum, p) => sum + Number(p.process_cost), 0);

  const PIE_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  const handleExport = () => {
    exportToExcel('Cost_Breakdown_Report', [
      {
        name: 'Process Operating Costs',
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Process Cost & Part-Wise Cost Module
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Operational cost breakdowns across Manpower, Energy, Gases, Consumables, and Model part-level cost accounting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Export Cost Matrix
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Process Cost"
          value={formatCurrencyBDT(totalPlantCost)}
          subtitle="Monthly manufacturing expenditure"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Refrigerant & Gas Cost"
          value={formatCurrencyBDT(categoryMap['Gas'] || 0)}
          subtitle="Bulk R32 / R290 / N2 Purging"
          icon={DollarSign}
          color="rose"
        />
        <StatCard
          title="Plant Manpower Cost"
          value={formatCurrencyBDT(categoryMap['Manpower'] || 0)}
          subtitle="Direct assembly line labor"
          icon={DollarSign}
          color="indigo"
        />
        <StatCard
          title="Energy & Electricity"
          value={formatCurrencyBDT(categoryMap['Electricity'] || 0)}
          subtitle="Induction heaters & vacuum pumps"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs">
        <button
          onClick={() => setActiveTab('process-cost')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition ${
            activeTab === 'process-cost'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Operational Process Costs ({costRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('part-cost')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition ${
            activeTab === 'part-cost'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Model & Part-Wise Process Cost ({partCosts.length})</span>
        </button>
      </div>

      {/* TAB 1: Operational Process Cost */}
      {activeTab === 'process-cost' && (
        <div className="space-y-6">
          {/* Cost Donut & Category Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  Detailed Operational Cost Entries
                </h3>
                <Link
                  href="/admin?action=new-cost"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
                >
                  Add Cost Entry
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4">Section Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Monthly Cost</th>
                      <th className="py-3 px-4">Cost / Piece</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {costRecords.map((c) => {
                      const sec = sections.find((s) => s.id === c.section_id);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{sec?.name || '-'}</td>
                          <td className="py-3 px-4">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                              {c.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                            {formatCurrencyBDT(c.cost_amount)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-blue-600">৳{c.cost_per_piece}</td>
                          <td className="py-3 px-4 text-slate-500">{c.period}</td>
                          <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                            {c.remarks || '-'}
                          </td>
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

      {/* TAB 2: Part-Wise Process Cost */}
      {activeTab === 'part-cost' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search part name, model..."
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Model:</span>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              >
                <option value="All">All AC Models</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <Link
                href="/admin?action=new-part-cost"
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shrink-0"
              >
                Add Part Cost
              </Link>
            </div>
          </div>

          {/* Part Wise Cost Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">AC Model</th>
                    <th className="py-3 px-4">Component / Part</th>
                    <th className="py-3 px-4">Assembly Process</th>
                    <th className="py-3 px-4">SAM (sec)</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Part Unit Cost</th>
                    <th className="py-3 px-4">Process Labor Cost</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPartCosts.map((p) => {
                    const proc = processes.find((pr) => pr.id === p.process_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-bold text-blue-700">{p.model_name}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.part_name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{proc?.name || 'Sub-assembly'}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{p.sam_sec} s</td>
                        <td className="py-3.5 px-4 font-semibold">{p.quantity}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {formatCurrencyBDT(p.unit_cost)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                          ৳{p.process_cost}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">{p.remarks || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs flex justify-between items-center font-bold">
              <span className="text-slate-500">Showing {filteredPartCosts.length} component parts</span>
              <span className="text-slate-900">
                Total Filtered Labor Cost: <span className="text-emerald-700">৳{totalPartWiseCost.toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
