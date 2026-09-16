'use client';

import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal,
  ChevronRight,
  Layers,
  AlertTriangle,
  Factory,
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
} from 'recharts';
import { store } from '../lib/store';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { formatCurrencyBDT, formatNumber } from '../lib/calculations';
import { Section } from '../types';

export default function DashboardPage() {
  const [, setTick] = useState(0);
  const [sectionSearch, setSectionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

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

  // KPI Calculations
  const totalSections = sections.length;
  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => m.status === 'Active').length;
  const totalProcesses = processes.length;

  const totalDailyCapacity = capacityRecords.reduce(
    (sum, r) => sum + (Number(r.daily_capacity) || 0),
    0
  );

  const avgSAMSec = processes.length
    ? Number(
        (
          processes.reduce((sum, p) => sum + (Number(p.sam_sec) || 0), 0) /
          processes.length
        ).toFixed(1)
      )
    : 0;

  const totalMonthlyCost = costRecords.reduce(
    (sum, c) => sum + (Number(c.cost_amount) || 0),
    0
  );

  // 1. Chart: Machine Distribution by Section
  const machineDistData = sections.map((sec) => ({
    name: sec.name.length > 14 ? sec.name.substring(0, 12) + '...' : sec.name,
    fullName: sec.name,
    machines: machines.filter((m) => m.section_id === sec.id).length,
  }));

  // 2. Chart: Capacity by Section
  const capacityData = sections.map((sec) => {
    const secCap = capacityRecords
      .filter((c) => c.section_id === sec.id)
      .reduce((sum, r) => sum + (Number(r.daily_capacity) || 0), 0);
    return {
      name: sec.name.length > 14 ? sec.name.substring(0, 12) + '...' : sec.name,
      fullName: sec.name,
      capacity: secCap,
    };
  }).filter((d) => d.capacity > 0);

  // 3. Chart: SAM Analysis (Top 8 processes)
  const samChartData = [...processes]
    .sort((a, b) => b.sam_sec - a.sam_sec)
    .slice(0, 8)
    .map((p) => ({
      name: p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name,
      fullName: p.name,
      sam: p.sam_sec,
    }));

  // 4. Chart: Cost Distribution by Category
  const costCategoryMap: Record<string, number> = {};
  costRecords.forEach((c) => {
    costCategoryMap[c.category] = (costCategoryMap[c.category] || 0) + Number(c.cost_amount);
  });
  const costPieData = Object.entries(costCategoryMap).map(([cat, amount]) => ({
    name: cat,
    value: amount,
  }));

  // 5. Chart: Machine Status Breakdown
  const statusCounts = {
    Active: machines.filter((m) => m.status === 'Active').length,
    'Under Maintenance': machines.filter((m) => m.status === 'Under Maintenance').length,
    Inactive: machines.filter((m) => m.status === 'Inactive').length,
    Decommissioned: machines.filter((m) => m.status === 'Decommissioned').length,
  };
  const machineStatusData = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
    }));

  const PIE_COLORS = ['#00A8E8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
  const STATUS_COLORS: Record<string, string> = {
    Active: '#10B981',
    'Under Maintenance': '#F59E0B',
    Inactive: '#64748B',
    Decommissioned: '#EF4444',
  };

  // Section grid filtering
  const filteredSections = sections.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(sectionSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(sectionSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#3A506B] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <Factory className="h-64 w-64 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span>Walton Air Conditioner Manufacturing Complex</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Process Development & Industrial Engineering
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Centralized monitoring and digital management of AC manufacturing sections, asset specifications,
            process cycles, Standard Allowed Minutes (SAM), plant capacity models, and manufacturing costs.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sections"
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/30 hover:bg-blue-500 transition"
            >
              <Grid className="mr-1.5 h-4 w-4" />
              <span>Explore All Sections</span>
            </Link>
            <Link
              href="/machines/compare"
              className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs hover:bg-white/20 transition border border-white/10"
            >
              <span>Machine Comparison</span>
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center rounded-xl bg-sky-500/20 px-4 py-2 text-xs font-semibold text-sky-300 backdrop-blur-xs hover:bg-sky-500/30 transition border border-sky-400/30"
            >
              <span>Admin Input Panel</span>
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 7 Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard
          title="Total Sections"
          value={totalSections}
          subtitle="Plant Lines"
          icon={Grid}
          color="blue"
        />
        <StatCard
          title="Total Machines"
          value={totalMachines}
          subtitle="Asset Records"
          icon={Cpu}
          color="indigo"
        />
        <StatCard
          title="Active Machines"
          value={activeMachines}
          subtitle={`${Math.round((activeMachines / (totalMachines || 1)) * 100)}% uptime`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Processes"
          value={totalProcesses}
          subtitle="Engineered Steps"
          icon={Workflow}
          color="purple"
        />
        <StatCard
          title="Daily Capacity"
          value={`${formatNumber(totalDailyCapacity)}`}
          subtitle="pcs / day"
          icon={Gauge}
          color="blue"
        />
        <StatCard
          title="Avg SAM"
          value={`${avgSAMSec} s`}
          subtitle="Per station cycle"
          icon={Timer}
          color="amber"
        />
        <StatCard
          title="Process Cost"
          value={formatCurrencyBDT(totalMonthlyCost)}
          subtitle="Monthly Plant"
          icon={DollarSign}
          color="rose"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Machines per Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Machine Distribution by Section
              </h3>
              <p className="text-xs text-slate-500">Asset count across plant departments</p>
            </div>
            <Badge variant="info">Assets</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineDistData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Machines`, 'Count']}
                  labelFormatter={(label, payload) => (payload[0] ? payload[0].payload.fullName : label)}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="machines" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Capacity by Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daily Capacity by Section
              </h3>
              <p className="text-xs text-slate-500">Output potential (pcs/day) factoring efficiency</p>
            </div>
            <Badge variant="success">Capacity</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any) => [`${formatNumber(Number(value))} pcs/day`, 'Daily Capacity']}
                  labelFormatter={(label, payload) => (payload[0] ? payload[0].payload.fullName : label)}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="capacity" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: SAM Analysis (Bottleneck Detection) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Process Cycle Time & SAM (sec)
              </h3>
              <p className="text-xs text-slate-500">Top time-intensive processes (Bottleneck identification)</p>
            </div>
            <Badge variant="warning">Bottlenecks</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={samChartData}
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit="s" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                <Tooltip
                  formatter={(value: any) => [`${value} seconds`, 'Standard Allowed Minute']}
                  labelFormatter={(label, payload) => (payload[0] ? payload[0].payload.fullName : label)}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="sam" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4 & 5: Cost & Machine Status Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cost Donut */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Cost Distribution
              </h4>
              <p className="text-[11px] text-slate-400">By operational category</p>
            </div>
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {costPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrencyBDT(Number(val)), 'Amount']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {costPieData.slice(0, 4).map((c, i) => (
                <span key={c.name} className="flex items-center text-[10px] text-slate-500">
                  <span className="h-2 w-2 rounded-full mr-1" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Status Donut */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Machine Status
              </h4>
              <p className="text-[11px] text-slate-400">Operational readiness</p>
            </div>
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={machineStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {machineStatusData.map((entry) => (
                      <Cell key={`status-${entry.name}`} fill={STATUS_COLORS[entry.name] || '#64748B'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} Units`, 'Status Count']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {machineStatusData.map((s) => (
                <span key={s.name} className="flex items-center text-[10px] text-slate-500 font-medium">
                  <span className="h-2 w-2 rounded-full mr-1" style={{ backgroundColor: STATUS_COLORS[s.name] || '#64748b' }}></span>
                  {s.name}: {s.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Section Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              Factory Sections & Production Lines
            </h3>
            <p className="text-xs text-slate-500">
              Click on any section to open its dedicated technical dashboard, machine registry, process mapping, and capacity models.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter section..."
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Filter Toggle */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Add Section Link */}
            <Link
              href="/admin?action=new-section"
              className="inline-flex items-center rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              <span>Add Section</span>
            </Link>
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSections.map((sec) => {
            const secMachines = machines.filter((m) => m.section_id === sec.id);
            const secProcesses = processes.filter((p) => p.section_id === sec.id);
            const secCapacity = capacityRecords
              .filter((c) => c.section_id === sec.id)
              .reduce((sum, r) => sum + (Number(r.daily_capacity) || 0), 0);

            return (
              <Link
                key={sec.id}
                href={`/sections/${sec.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
              >
                {/* Image Banner */}
                {sec.photo_url ? (
                  <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                    <img
                      src={sec.photo_url}
                      alt={sec.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-xs border border-white/15">
                        {sec.code}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={sec.status === 'Active' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {sec.status}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-base font-bold text-white leading-tight drop-shadow-xs group-hover:text-sky-300 transition">
                        {sec.name}
                      </h4>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 font-mono">
                        {sec.code}
                      </span>
                      <Badge variant="success" size="sm">
                        {sec.status}
                      </Badge>
                    </div>
                    <h4 className="mt-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {sec.name}
                    </h4>
                  </div>
                )}

                {/* Card Content & Counts */}
                <div className="flex-1 p-4 space-y-3">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {sec.description || 'No section description configured.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Machines</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{secMachines.length} Units</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Processes</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{secProcesses.length} Steps</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400">Daily Capacity:</span>
                    <span className="font-bold text-slate-800">
                      {secCapacity > 0 ? `${formatNumber(secCapacity)} pcs/day` : 'Configured on line'}
                    </span>
                  </div>
                </div>

                {/* Card Footer Link Bar */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-blue-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                  <span>View Section Dashboard</span>
                  <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
