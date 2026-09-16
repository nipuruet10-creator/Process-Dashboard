'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Grid,
  Cpu,
  DollarSign,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { store } from '../../lib/store';
import { exportToExcel, exportToCSV } from '../../lib/excel';
import { formatCurrencyBDT, formatNumber } from '../../lib/calculations';

type ReportType = 'section' | 'machine' | 'cost' | 'sam';

export default function ReportsPage() {
  const [, setTick] = useState(0);
  const [reportType, setReportType] = useState<ReportType>('section');

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const sections = store.sections;
  const machines = store.machines;
  const processes = store.processes;
  const costRecords = store.costRecords;
  const samRecords = store.samRecords;
  const capacityRecords = store.capacityRecords;

  // 1. Section Report Rows
  const sectionReportRows = sections.map((s) => {
    const secMachines = machines.filter((m) => m.section_id === s.id);
    const secProcesses = processes.filter((p) => p.section_id === s.id);
    const secCost = costRecords
      .filter((c) => c.section_id === s.id)
      .reduce((sum, c) => sum + Number(c.cost_amount), 0);
    const secCap = capacityRecords
      .filter((c) => c.section_id === s.id)
      .reduce((sum, r) => sum + Number(r.daily_capacity), 0);
    const secSAM = secProcesses.length
      ? (secProcesses.reduce((sum, p) => sum + Number(p.sam_sec), 0) / secProcesses.length).toFixed(1)
      : '0';

    return {
      section_code: s.code,
      section_name: s.name,
      total_machines: secMachines.length,
      active_machines: secMachines.filter((m) => m.status === 'Active').length,
      total_processes: secProcesses.length,
      daily_capacity: secCap,
      avg_sam_sec: secSAM,
      monthly_cost: secCost,
    };
  });

  // 2. Machine Report Rows
  const machineReportRows = machines.map((m) => {
    const sec = sections.find((s) => s.id === m.section_id);
    return {
      machine_id: m.machine_id,
      machine_name: m.name,
      section_name: sec?.name || '-',
      line: m.line,
      machine_type: m.machine_type,
      brand: m.brand || '-',
      model: m.model || '-',
      status: m.status,
      installation_date: m.installation_date || '-',
    };
  });

  // 3. Cost Report Rows
  const costReportRows = costRecords.map((c) => {
    const sec = sections.find((s) => s.id === c.section_id);
    return {
      section_name: sec?.name || c.section_id,
      category: c.category,
      amount_bdt: c.cost_amount,
      cost_per_piece: c.cost_per_piece,
      period: c.period,
      remarks: c.remarks || '-',
    };
  });

  // 4. SAM Report Rows
  const samReportRows = processes.map((p) => {
    const sec = sections.find((s) => s.id === p.section_id);
    const mach = machines.find((m) => m.id === p.machine_id);
    return {
      process_name: p.name,
      sub_process: p.sub_process || '-',
      section_name: sec?.name || '-',
      machine_assigned: mach ? `${mach.machine_id} - ${mach.name}` : 'Manual Station',
      cycle_time_sec: p.cycle_time_sec,
      sam_sec: p.sam_sec,
      manpower: p.manpower,
      hourly_capacity: p.hourly_capacity,
    };
  });

  // Handlers for export
  const handleExportExcel = () => {
    if (reportType === 'section') {
      exportToExcel('Section_Management_Report', [
        {
          name: 'Sections',
          columns: [
            { header: 'Section Code', key: 'section_code', width: 16 },
            { header: 'Section Name', key: 'section_name', width: 25 },
            { header: 'Total Machines', key: 'total_machines', width: 15 },
            { header: 'Active Machines', key: 'active_machines', width: 15 },
            { header: 'Processes', key: 'total_processes', width: 12 },
            { header: 'Daily Capacity', key: 'daily_capacity', width: 16 },
            { header: 'Avg SAM (sec)', key: 'avg_sam_sec', width: 15 },
            { header: 'Monthly Cost (BDT)', key: 'monthly_cost', width: 20 },
          ],
          data: sectionReportRows,
        },
      ]);
    } else if (reportType === 'machine') {
      exportToExcel('Machine_Asset_Report', [
        {
          name: 'Machines',
          columns: [
            { header: 'Machine ID', key: 'machine_id', width: 15 },
            { header: 'Machine Name', key: 'machine_name', width: 30 },
            { header: 'Section', key: 'section_name', width: 22 },
            { header: 'Line', key: 'line', width: 20 },
            { header: 'Type', key: 'machine_type', width: 20 },
            { header: 'Brand', key: 'brand', width: 15 },
            { header: 'Model', key: 'model', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Installed', key: 'installation_date', width: 15 },
          ],
          data: machineReportRows,
        },
      ]);
    } else if (reportType === 'cost') {
      exportToExcel('Process_Cost_Report', [
        {
          name: 'Cost Summary',
          columns: [
            { header: 'Section', key: 'section_name', width: 25 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'Amount (BDT)', key: 'amount_bdt', width: 18 },
            { header: 'Cost/Piece', key: 'cost_per_piece', width: 15 },
            { header: 'Period', key: 'period', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 30 },
          ],
          data: costReportRows,
        },
      ]);
    } else {
      exportToExcel('SAM_Engineering_Report', [
        {
          name: 'SAM Report',
          columns: [
            { header: 'Process Name', key: 'process_name', width: 30 },
            { header: 'Sub Process', key: 'sub_process', width: 20 },
            { header: 'Section', key: 'section_name', width: 22 },
            { header: 'Machine', key: 'machine_assigned', width: 25 },
            { header: 'Cycle Time (sec)', key: 'cycle_time_sec', width: 16 },
            { header: 'SAM (sec)', key: 'sam_sec', width: 15 },
            { header: 'Manpower', key: 'manpower', width: 12 },
            { header: 'Capacity/hr', key: 'hourly_capacity', width: 15 },
          ],
          data: samReportRows,
        },
      ]);
    }
  };

  const handleExportCSV = () => {
    let data: Record<string, any>[] = [];
    if (reportType === 'section') data = sectionReportRows;
    else if (reportType === 'machine') data = machineReportRows;
    else if (reportType === 'cost') data = costReportRows;
    else data = samReportRows;

    exportToCSV(`${reportType}_report`, data);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Engineering & Management Reporting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate executive factory summaries, line balance reports, and export to Excel, CSV, or Print PDF.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition"
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Download className="mr-1.5 h-4 w-4 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition"
          >
            <Printer className="mr-1.5 h-4 w-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs no-print overflow-x-auto">
        <button
          onClick={() => setReportType('section')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition ${
            reportType === 'section'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>Section Overview Report</span>
        </button>

        <button
          onClick={() => setReportType('machine')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition ${
            reportType === 'machine'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Machine Asset Report</span>
        </button>

        <button
          onClick={() => setReportType('cost')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition ${
            reportType === 'cost'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Manufacturing Cost Report</span>
        </button>

        <button
          onClick={() => setReportType('sam')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition ${
            reportType === 'sam'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Timer className="h-4 w-4" />
          <span>SAM & Line Balancing Report</span>
        </button>
      </div>

      {/* Printable Report Canvas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Report Header for Print */}
        <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
              Walton Hi-Tech Industries PLC • AC Division
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase mt-0.5">
              {reportType === 'section' && 'Section Engineering Summary Report'}
              {reportType === 'machine' && 'Machine & Asset Registry Report'}
              {reportType === 'cost' && 'Monthly Manufacturing Cost Report'}
              {reportType === 'sam' && 'Standard Allowed Minute (SAM) Analysis Report'}
            </h2>
            <p className="text-xs text-slate-400">
              Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} • Confidential
            </p>
          </div>
          <div className="text-right text-xs font-mono font-bold text-slate-600">
            SYSTEM VERSION 1.0
          </div>
        </div>

        {/* Dynamic Table Output */}
        <div className="overflow-x-auto">
          {reportType === 'section' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Section Name</th>
                  <th className="py-2.5 px-3 text-center">Machines</th>
                  <th className="py-2.5 px-3 text-center">Active</th>
                  <th className="py-2.5 px-3 text-center">Processes</th>
                  <th className="py-2.5 px-3">Daily Capacity</th>
                  <th className="py-2.5 px-3">Avg SAM</th>
                  <th className="py-2.5 px-3 text-right">Monthly Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {sectionReportRows.map((r) => (
                  <tr key={r.section_code} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{r.section_code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.section_name}</td>
                    <td className="py-2.5 px-3 text-center font-semibold">{r.total_machines}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">{r.active_machines}</td>
                    <td className="py-2.5 px-3 text-center">{r.total_processes}</td>
                    <td className="py-2.5 px-3 font-mono">{formatNumber(r.daily_capacity)} pcs/day</td>
                    <td className="py-2.5 px-3 font-mono text-amber-600 font-bold">{r.avg_sam_sec} s</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrencyBDT(r.monthly_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'machine' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Machine ID</th>
                  <th className="py-2.5 px-3">Machine Name</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Line</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Brand & Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Installed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {machineReportRows.map((m) => (
                  <tr key={m.machine_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{m.machine_id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.machine_name}</td>
                    <td className="py-2.5 px-3">{m.section_name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{m.line}</td>
                    <td className="py-2.5 px-3">{m.machine_type}</td>
                    <td className="py-2.5 px-3">
                      {m.brand} {m.model}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{m.status}</td>
                    <td className="py-2.5 px-3 text-slate-500">{m.installation_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'cost' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Amount (BDT)</th>
                  <th className="py-2.5 px-3">Cost / Piece</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {costReportRows.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.section_name}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{c.category}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {formatCurrencyBDT(c.amount_bdt)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-blue-600">৳{c.cost_per_piece}</td>
                    <td className="py-2.5 px-3 text-slate-500">{c.period}</td>
                    <td className="py-2.5 px-3 text-slate-500">{c.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sam' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Process Name</th>
                  <th className="py-2.5 px-3">Sub Process</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Machine</th>
                  <th className="py-2.5 px-3">Cycle Time</th>
                  <th className="py-2.5 px-3">Allocated SAM</th>
                  <th className="py-2.5 px-3">Manpower</th>
                  <th className="py-2.5 px-3">Capacity/hr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {samReportRows.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{s.process_name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.sub_process}</td>
                    <td className="py-2.5 px-3">{s.section_name}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-600">{s.machine_assigned}</td>
                    <td className="py-2.5 px-3 font-mono">{s.cycle_time_sec} s</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-600">{s.sam_sec} s</td>
                    <td className="py-2.5 px-3 font-semibold">{s.manpower} op</td>
                    <td className="py-2.5 px-3 font-mono">{s.hourly_capacity} pcs/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
