'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { store } from '../../lib/store';
import { StatCard } from '../../components/ui/StatCard';
import { calculateCapacity, formatNumber } from '../../lib/calculations';
import { exportToExcel } from '../../lib/excel';

export default function CapacityPage() {
  const [, setTick] = useState(0);

  // Simulation inputs
  const [machineCapacityHr, setMachineCapacityHr] = useState<number>(75);
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [shifts, setShifts] = useState<number>(2);
  const [efficiency, setEfficiency] = useState<number>(85);
  const [manpower, setManpower] = useState<number>(24);

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const sections = store.sections;
  const capacityRecords = store.capacityRecords;

  const simResult = calculateCapacity({
    machineCapacityPerHour: machineCapacityHr,
    workingHours,
    shiftCount: shifts,
    efficiencyPct: efficiency,
  });

  const handleExport = () => {
    exportToExcel('Plant_Capacity_Calculations', [
      {
        name: 'Capacity Records',
        columns: [
          { header: 'Section Name', key: 'section_name', width: 25 },
          { header: 'Nominal Cap (pcs/hr)', key: 'machine_capacity_hr', width: 20 },
          { header: 'Working Hours', key: 'working_hours', width: 15 },
          { header: 'Shifts', key: 'shift_count', width: 12 },
          { header: 'Efficiency %', key: 'efficiency_pct', width: 15 },
          { header: 'Daily Output', key: 'daily_capacity', width: 15 },
          { header: 'Monthly Output', key: 'monthly_capacity', width: 18 },
        ],
        data: capacityRecords.map((r) => {
          const sec = sections.find((s) => s.id === r.section_id);
          return {
            section_name: sec?.name || r.section_id,
            ...r,
          };
        }),
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Plant Capacity Engineering Module
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic capacity calculation models based on machine cycle speeds, multi-shift configurations, and line efficiency factors.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
          Export Capacity Models
        </button>
      </div>

      {/* Simulator Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
              Real-Time Line Capacity Simulation Engine
            </h2>
            <p className="text-xs text-slate-500">
              Interactive IE mathematical model: Hourly = Cap × Efficiency | Daily = Hourly × Hours × Shifts | Monthly = Daily × 26 Days
            </p>
          </div>
          <button
            onClick={() => {
              setMachineCapacityHr(75);
              setWorkingHours(8);
              setShifts(2);
              setEfficiency(85);
            }}
            className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="mr-1 h-3 w-3" /> Reset Baseline
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50/70 rounded-xl border border-slate-200">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Nominal Machine Speed</span>
              <span className="font-mono text-blue-600">{machineCapacityHr} pcs/hr</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={machineCapacityHr}
              onChange={(e) => setMachineCapacityHr(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Design cycle rated capacity</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Shift Working Hours</span>
              <span className="font-mono text-blue-600">{workingHours} Hours</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              step="0.5"
              value={workingHours}
              onChange={(e) => setWorkingHours(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Net production time per shift</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Daily Shift Count</span>
              <span className="font-mono text-blue-600">{shifts} Shifts</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={shifts}
              onChange={(e) => setShifts(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">1 = Single, 2 = Standard, 3 = 24h</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Line Efficiency / OEE</span>
              <span className="font-mono text-emerald-600">{efficiency}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={efficiency}
              onChange={(e) => setEfficiency(Number(e.target.value))}
              className="w-full cursor-pointer accent-emerald-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">OEE factoring downtime & speed loss</p>
          </div>
        </div>

        {/* Calculated Results Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-slate-400">Effective Hourly Output</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              {simResult.hourlyCapacity}
            </h3>
            <p className="text-xs text-slate-500 mt-1">pcs / hour</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-slate-400">Shift Output ({workingHours} hrs)</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              {formatNumber(simResult.shiftCapacity)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">pcs / shift</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-blue-700">Calculated Daily Capacity</p>
            <h3 className="text-3xl font-black text-blue-800 mt-2">
              {formatNumber(simResult.dailyCapacity)}
            </h3>
            <p className="text-xs text-blue-600 mt-1">pcs / day ({shifts} shifts)</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-emerald-700">Monthly Plant Capacity</p>
            <h3 className="text-3xl font-black text-emerald-800 mt-2">
              {formatNumber(simResult.monthlyCapacity)}
            </h3>
            <p className="text-xs text-emerald-600 mt-1">pcs / month (26 days)</p>
          </div>
        </div>
      </div>

      {/* Existing Section Capacity Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recorded Line Capacity Benchmarks
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Section Name</th>
                <th className="py-3 px-4">Nominal Speed</th>
                <th className="py-3 px-4">Shift Setup</th>
                <th className="py-3 px-4">Efficiency Factor</th>
                <th className="py-3 px-4">Hourly Output</th>
                <th className="py-3 px-4">Shift Output</th>
                <th className="py-3 px-4">Daily Output</th>
                <th className="py-3 px-4">Monthly Output</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {capacityRecords.map((r) => {
                const sec = sections.find((s) => s.id === r.section_id);
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sec?.name || '-'}</td>
                    <td className="py-3.5 px-4 font-mono font-medium">{r.machine_capacity_hr} pcs/hr</td>
                    <td className="py-3.5 px-4">
                      {r.shift_count} shifts × {r.working_hours} hrs
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">{r.efficiency_pct}%</td>
                    <td className="py-3.5 px-4 font-mono">{r.hourly_capacity} pcs</td>
                    <td className="py-3.5 px-4 font-mono">{formatNumber(r.shift_capacity)} pcs</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {formatNumber(r.daily_capacity)} pcs
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatNumber(r.monthly_capacity)} pcs
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {r.remarks || '-'}
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
