'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings2,
  Plus,
  Trash2,
  Edit,
  Grid,
  Cpu,
  Workflow,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Shield,
  History,
  Sliders,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  Database,
} from 'lucide-react';
import { store } from '../../lib/store';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { parseExcelUpload } from '../../lib/excel';
import {
  Section,
  Machine,
  Process,
  CustomField,
  CustomFieldType,
  CustomTable,
  TargetEntity,
  UserRole,
} from '../../types';

type AdminTab =
  | 'overview'
  | 'sections'
  | 'machines'
  | 'processes'
  | 'fields'
  | 'tables'
  | 'import'
  | 'users'
  | 'audit';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [, setTick] = useState(0);

  const initialTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const currentUser = store.currentUser;
  const isReadOnly = currentUser?.role === 'viewer';

  // Modal states
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Section Form state
  const [secForm, setSecForm] = useState({
    code: '',
    name: '',
    department: 'Process Development & IE',
    description: '',
    responsible_person: '',
    photo_url: '',
    status: 'Active' as const,
    sort_order: 1,
  });

  // Machine Form state
  const [machForm, setMachForm] = useState({
    machine_id: '',
    name: '',
    section_id: '',
    line: 'Line 1',
    process_name: '',
    sub_process: '',
    machine_type: '',
    manufacturer: '',
    brand: '',
    model: '',
    serial_number: '',
    installation_date: new Date().toISOString().split('T')[0],
    status: 'Active' as const,
    description: '',
  });

  // Process Form state
  const [procForm, setProcForm] = useState({
    name: '',
    section_id: '',
    machine_id: '',
    sub_process: '',
    description: '',
    cycle_time_sec: 45,
    sam_sec: 50,
    hourly_capacity: 70,
    manpower: 1,
    process_cost: 20,
    critical_parameters: '',
    quality_check: '',
    sop_url: '',
  });

  // Custom Field Form state
  const [fieldForm, setFieldForm] = useState({
    target_entity: 'machine' as TargetEntity,
    field_name: '',
    field_key: '',
    field_type: 'text' as CustomFieldType,
    unit: '',
    optionsString: '',
    is_required: false,
    default_value: '',
  });

  // Dynamic Table Form state
  const [tableForm, setTableForm] = useState({
    name: '',
    slug: '',
    description: '',
    target_entity: 'machine' as TargetEntity,
    firstColumnName: 'Parameter',
    firstColumnKey: 'parameter',
    firstColumnType: 'text' as const,
  });

  // Excel Import state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedSheets, setParsedSheets] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [targetEntityForImport, setTargetEntityForImport] = useState<'machine' | 'process'>('machine');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [importSuccessMessage, setImportSuccessMessage] = useState<string>('');

  // Handlers for Save
  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer role has read-only access.');
    if (!secForm.name || !secForm.code) return alert('Please enter section name and code.');

    store.addSection(secForm);
    setIsSectionModalOpen(false);
    setSecForm({
      code: '',
      name: '',
      department: 'Process Development & IE',
      description: '',
      responsible_person: '',
      photo_url: '',
      status: 'Active',
      sort_order: 1,
    });
  };

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer role has read-only access.');
    if (!machForm.name || !machForm.machine_id) return alert('Please enter machine name and ID.');

    store.addMachine({
      ...machForm,
      section_id: machForm.section_id || store.sections[0]?.id || '',
    });
    setIsMachineModalOpen(false);
    setMachForm({
      machine_id: '',
      name: '',
      section_id: '',
      line: 'Line 1',
      process_name: '',
      sub_process: '',
      machine_type: '',
      manufacturer: '',
      brand: '',
      model: '',
      serial_number: '',
      installation_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      description: '',
    });
  };

  const handleSaveProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer role has read-only access.');
    if (!procForm.name) return alert('Please enter process name.');

    store.addProcess({
      ...procForm,
      section_id: procForm.section_id || store.sections[0]?.id || '',
      cycle_time_sec: Number(procForm.cycle_time_sec) || 45,
      sam_sec: Number(procForm.sam_sec) || 50,
      hourly_capacity: Number(procForm.hourly_capacity) || 70,
      manpower: Number(procForm.manpower) || 1,
      process_cost: Number(procForm.process_cost) || 20,
    });
    setIsProcessModalOpen(false);
  };

  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer role has read-only access.');
    if (!fieldForm.field_name) return alert('Please enter field name.');

    const key = fieldForm.field_key || fieldForm.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const options = fieldForm.field_type === 'dropdown'
      ? fieldForm.optionsString.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    store.addCustomField({
      target_entity: fieldForm.target_entity,
      field_name: fieldForm.field_name,
      field_key: key,
      field_type: fieldForm.field_type,
      unit: fieldForm.unit || undefined,
      options,
      is_required: fieldForm.is_required,
      default_value: fieldForm.default_value || undefined,
      sort_order: store.customFields.length + 1,
    });

    setIsFieldModalOpen(false);
    setFieldForm({
      target_entity: 'machine',
      field_name: '',
      field_key: '',
      field_type: 'text',
      unit: '',
      optionsString: '',
      is_required: false,
      default_value: '',
    });
  };

  const handleSaveCustomTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer role has read-only access.');
    if (!tableForm.name) return alert('Please enter table name.');

    const slug = tableForm.slug || tableForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newTbl = store.addCustomTable({
      name: tableForm.name,
      slug,
      description: tableForm.description,
      target_entity: tableForm.target_entity,
    });

    // Add first column
    store.addTableColumn(newTbl.id, {
      column_name: tableForm.firstColumnName,
      column_key: tableForm.firstColumnKey || 'param_1',
      data_type: tableForm.firstColumnType,
      is_required: true,
      sort_order: 1,
    });

    setIsTableModalOpen(false);
  };

  // Excel Upload Parser
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);

    try {
      const parsed = await parseExcelUpload(file);
      setParsedSheets(parsed);
      if (parsed.sheetNames.length > 0) {
        setSelectedSheet(parsed.sheetNames[0]);
      }
    } catch (err) {
      console.error('Failed to parse excel', err);
      alert('Failed to parse the uploaded Excel file. Ensure valid format (.xlsx or .csv).');
    }
  };

  const handleExecuteImport = () => {
    if (isReadOnly) return alert('Viewer role has read-only access.');
    if (!parsedSheets || !selectedSheet) return;

    const sheetData = parsedSheets.sheets[selectedSheet];
    if (!sheetData || !sheetData.rows.length) return alert('Selected sheet contains no rows.');

    let importedCount = 0;
    if (targetEntityForImport === 'machine') {
      sheetData.rows.forEach((row: any) => {
        const name = row[columnMappings['name']] || row['Machine Name'] || row['name'];
        const machine_id = row[columnMappings['machine_id']] || row['Machine ID'] || row['machine_id'];

        if (name && machine_id) {
          store.addMachine({
            machine_id: String(machine_id),
            name: String(name),
            section_id: store.sections[0]?.id || '',
            line: String(row[columnMappings['line']] || 'Line 1'),
            machine_type: String(row[columnMappings['machine_type']] || 'Imported Equipment'),
            brand: String(row[columnMappings['brand']] || 'OEM'),
            model: String(row[columnMappings['model']] || ''),
            status: 'Active',
            description: 'Imported via Excel Batch Import Wizard',
          });
          importedCount++;
        }
      });
    }

    setImportSuccessMessage(`Successfully imported ${importedCount} records from ${selectedSheet}!`);
    setTimeout(() => setImportSuccessMessage(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-rose-600 font-bold uppercase tracking-wider mb-1">
            <Shield className="h-4 w-4" />
            <span>Administrative Control & Configuration</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            System Administration & Schema Builder
          </h1>
          <p className="text-xs text-slate-500">
            Configure plant sections, machines, custom metadata fields, dynamic tables, Excel imports, and user permissions.
          </p>
        </div>

        {isReadOnly && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1.5 text-amber-600" />
            <span>Current role is Viewer (Read Only). Switch to Admin in top header to edit.</span>
          </div>
        )}
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs overflow-x-auto">
        {[
          { id: 'overview', label: 'Admin Overview', icon: Settings2 },
          { id: 'sections', label: 'Sections', count: store.sections.length, icon: Grid },
          { id: 'machines', label: 'Machines', count: store.machines.length, icon: Cpu },
          { id: 'processes', label: 'Processes', count: store.processes.length, icon: Workflow },
          { id: 'fields', label: 'Dynamic Fields', count: store.customFields.length, icon: Sliders },
          { id: 'tables', label: 'Dynamic Tables', count: store.customTables.length, icon: TableIcon },
          { id: 'import', label: 'Excel Import Wizard', icon: FileSpreadsheet },
          { id: 'users', label: 'User Roles', count: store.users.length, icon: Shield },
          { id: 'audit', label: 'Audit Logs', count: store.auditLogs.length, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Creator Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="p-5 rounded-2xl border border-slate-200 bg-white text-left hover:border-blue-400 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Grid className="h-6 w-6" />
                </div>
                <Plus className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
              </div>
              <h3 className="mt-4 font-bold text-sm text-slate-900">Create Section</h3>
              <p className="text-xs text-slate-500 mt-1">Add new manufacturing line or department</p>
            </button>

            <button
              onClick={() => setIsMachineModalOpen(true)}
              className="p-5 rounded-2xl border border-slate-200 bg-white text-left hover:border-indigo-400 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Cpu className="h-6 w-6" />
                </div>
                <Plus className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <h3 className="mt-4 font-bold text-sm text-slate-900">Add Machine Asset</h3>
              <p className="text-xs text-slate-500 mt-1">Register equipment with specifications</p>
            </button>

            <button
              onClick={() => setIsFieldModalOpen(true)}
              className="p-5 rounded-2xl border border-slate-200 bg-white text-left hover:border-emerald-400 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Sliders className="h-6 w-6" />
                </div>
                <Plus className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <h3 className="mt-4 font-bold text-sm text-slate-900">New Custom Field</h3>
              <p className="text-xs text-slate-500 mt-1">Configurable metadata without code changes</p>
            </button>

            <button
              onClick={() => setIsTableModalOpen(true)}
              className="p-5 rounded-2xl border border-slate-200 bg-white text-left hover:border-purple-400 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                  <TableIcon className="h-6 w-6" />
                </div>
                <Plus className="h-5 w-5 text-slate-400 group-hover:text-purple-600" />
              </div>
              <h3 className="mt-4 font-bold text-sm text-slate-900">New Custom Table</h3>
              <p className="text-xs text-slate-500 mt-1">Define tables with dynamic columns & rows</p>
            </button>
          </div>

          {/* Quick System Statistics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase text-slate-900 mb-4">Architecture & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-500 uppercase text-[10px]">Database Engine</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Supabase PostgreSQL + Local Hybrid</p>
                <p className="text-slate-400 mt-1">Offline reactive cache with zero latency</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-500 uppercase text-[10px]">Active Authenticated User</p>
                <p className="text-sm font-bold text-blue-700 mt-1">{currentUser.full_name}</p>
                <p className="text-slate-400 mt-1">Role: {currentUser.role.toUpperCase()}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-500 uppercase text-[10px]">Dynamic Custom Entities</p>
                <p className="text-sm font-bold text-emerald-700 mt-1">
                  {store.customFields.length} Fields • {store.customTables.length} Custom Tables
                </p>
                <p className="text-slate-400 mt-1">100% configurable by administrators</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECTIONS MANAGEMENT */}
      {activeTab === 'sections' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-900">Manage Factory Sections</h3>
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Add Section
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">In-Charge</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {store.sections.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{s.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 text-slate-500">{s.department}</td>
                    <td className="py-3 px-4">{s.responsible_person || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={s.status === 'Active' ? 'success' : 'warning'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          if (confirm(`Delete section "${s.name}"?`)) {
                            store.deleteSection(s.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MACHINES MANAGEMENT */}
      {activeTab === 'machines' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-900">Manage Machine Assets</h3>
            <button
              onClick={() => setIsMachineModalOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Add Machine
            </button>
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
                {store.machines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{m.machine_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4">{m.machine_type}</td>
                    <td className="py-3 px-4">
                      {m.brand} {m.model}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={m.status === 'Active' ? 'success' : 'warning'} size="sm">
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete machine "${m.name}" (${m.machine_id})?`)) {
                            store.deleteMachine(m.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROCESSES MANAGEMENT */}
      {activeTab === 'processes' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-900">Manage Engineered Processes</h3>
            <button
              onClick={() => setIsProcessModalOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Add Process
            </button>
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
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {store.processes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.sub_process || '-'}</td>
                    <td className="py-3 px-4 font-mono">{p.cycle_time_sec} s</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{p.sam_sec} s</td>
                    <td className="py-3 px-4 font-semibold">{p.manpower} op</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete process "${p.name}"?`)) {
                            store.deleteProcess(p.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DYNAMIC CUSTOM FIELD BUILDER ("EVERYTHING IS CONFIGURABLE") */}
      {activeTab === 'fields' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-900">
                Dynamic Custom Field Engine
              </h3>
              <p className="text-xs text-slate-500">
                Add new attributes (Dropdown, Text, Numbers with Unit, Date) to machines, sections, or processes without code changes.
              </p>
            </div>
            <button
              onClick={() => setIsFieldModalOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Add New Custom Field
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Field Name</th>
                  <th className="py-3 px-4">Field Key</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Data Type</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Dropdown Options</th>
                  <th className="py-3 px-4">Required</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {store.customFields.map((cf) => (
                  <tr key={cf.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{cf.field_name}</td>
                    <td className="py-3 px-4 font-mono text-blue-600">{cf.field_key}</td>
                    <td className="py-3 px-4 font-semibold uppercase text-slate-600">{cf.target_entity}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono">{cf.field_type}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{cf.unit || '-'}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                      {cf.options ? cf.options.join(', ') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {cf.is_required ? (
                        <span className="text-rose-600 font-bold">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete custom field "${cf.field_name}"?`)) {
                            store.deleteCustomField(cf.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DYNAMIC TABLE BUILDER */}
      {activeTab === 'tables' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-900">
                Dynamic Custom Table Builder
              </h3>
              <p className="text-xs text-slate-500">
                Create user-defined tables, configure columns (types & units), and manage row data.
              </p>
            </div>
            <button
              onClick={() => setIsTableModalOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Create New Table
            </button>
          </div>

          <div className="space-y-4">
            {store.customTables.map((tbl) => {
              const cols = store.customTableColumns.filter((c) => c.table_id === tbl.id);
              const rows = store.customTableRows.filter((r) => r.table_id === tbl.id);

              return (
                <div key={tbl.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tbl.name}</h4>
                      <p className="text-xs text-slate-500">
                        Slug: <span className="font-mono text-blue-600">{tbl.slug}</span> • Target: {tbl.target_entity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const colName = prompt('Enter new column name:');
                          if (colName) {
                            store.addTableColumn(tbl.id, {
                              column_name: colName,
                              column_key: colName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                              data_type: 'text',
                              is_required: false,
                              sort_order: cols.length + 1,
                            });
                          }
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        + Add Column
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete table "${tbl.name}" and all its columns and rows?`)) {
                            store.deleteCustomTable(tbl.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Columns list */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {cols.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        <span>
                          {c.column_name} <span className="text-[10px] text-slate-400 font-mono">({c.data_type})</span>
                        </span>
                        <button
                          onClick={() => store.deleteTableColumn(c.id)}
                          className="ml-1.5 text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: EXCEL IMPORT WIZARD */}
      {activeTab === 'import' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-900">
              Excel / CSV Data Import Wizard
            </h3>
            <p className="text-xs text-slate-500">
              Upload legacy spreadsheets, preview sheets, map columns to system fields, validate, and import in bulk.
            </p>
          </div>

          {importSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition bg-slate-50/50">
            <Upload className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Upload Excel Spreadsheet</h4>
            <p className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, .csv files</p>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelUpload}
              className="mt-4 inline-block text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>

          {/* Sheet Selector & Column Mapping */}
          {parsedSheets && (
            <div className="space-y-6 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Worksheet</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold"
                  >
                    {parsedSheets.sheetNames.map((n: string) => (
                      <option key={n} value={n}>
                        {n} ({parsedSheets.sheets[n]?.rows.length} rows)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Entity</label>
                  <select
                    value={targetEntityForImport}
                    onChange={(e) => setTargetEntityForImport(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold"
                  >
                    <option value="machine">Machines</option>
                    <option value="process">Processes</option>
                  </select>
                </div>
              </div>

              {/* Column Mapping Interface */}
              {selectedSheet && parsedSheets.sheets[selectedSheet] && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Column Mapping ({selectedSheet})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {['name', 'machine_id', 'line', 'machine_type'].map((fieldKey) => (
                      <div key={fieldKey} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                          System Field: {fieldKey}
                        </span>
                        <select
                          value={columnMappings[fieldKey] || ''}
                          onChange={(e) =>
                            setColumnMappings({ ...columnMappings, [fieldKey]: e.target.value })
                          }
                          className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs"
                        >
                          <option value="">Select Excel column...</option>
                          {parsedSheets.sheets[selectedSheet].headers.map((h: string) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Preview Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl mt-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold">
                          {parsedSheets.sheets[selectedSheet].headers.slice(0, 6).map((h: string) => (
                            <th key={h} className="py-2 px-3 border-r border-slate-200">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedSheets.sheets[selectedSheet].rows.slice(0, 4).map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            {parsedSheets.sheets[selectedSheet].headers.slice(0, 6).map((h: string) => (
                              <td key={h} className="py-2 px-3 border-r border-slate-100 text-slate-600">
                                {r[h] !== undefined ? String(r[h]) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleExecuteImport}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20 transition flex items-center"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      <span>Execute Import ({parsedSheets.sheets[selectedSheet].rows.length} rows)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-900">User Profiles & Role Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {store.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-4 text-slate-500">{u.email}</td>
                    <td className="py-3 px-4">{u.department}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {u.role === 'admin' && <span className="text-rose-600 font-bold">Full Control (CRUD + Config)</span>}
                      {u.role === 'engineer' && <span className="text-blue-600 font-medium">Create & Edit Data</span>}
                      {u.role === 'management' && <span className="text-purple-600 font-medium">Dashboards & Reports</span>}
                      {u.role === 'viewer' && <span className="text-slate-400 font-medium">Read Only Access</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-900">System Activity Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {store.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.user_name}</td>
                    <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-slate-600">{log.user_role}</td>
                    <td className="py-2.5 px-4">
                      <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-blue-700 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700">{log.entity_type}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] max-w-xs truncate font-mono">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SECTION */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Create New Factory Section"
        subtitle="Add a new production line, assembly station, or test area"
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Section Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. SEC-CHILLER, SEC-VRF"
              value={secForm.code}
              onChange={(e) => setSecForm({ ...secForm, code: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Section Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Chiller Assembly Line"
              value={secForm.name}
              onChange={(e) => setSecForm({ ...secForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
            <input
              type="text"
              value={secForm.department}
              onChange={(e) => setSecForm({ ...secForm, department: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Responsible Person (In-Charge)</label>
            <input
              type="text"
              placeholder="e.g. Engr. Tanvir Rahman"
              value={secForm.responsible_person}
              onChange={(e) => setSecForm({ ...secForm, responsible_person: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Process details and operational scope..."
              value={secForm.description}
              onChange={(e) => setSecForm({ ...secForm, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSectionModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              Save Section
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD MACHINE */}
      <Modal
        isOpen={isMachineModalOpen}
        onClose={() => setIsMachineModalOpen(false)}
        title="Add Machine Asset Record"
        subtitle="Register equipment and connect to production line"
      >
        <form onSubmit={handleSaveMachine} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Machine ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. CHL-01, VAC-04"
                value={machForm.machine_id}
                onChange={(e) => setMachForm({ ...machForm, machine_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Machine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. High Pressure Gas Charger"
                value={machForm.name}
                onChange={(e) => setMachForm({ ...machForm, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Section</label>
              <select
                value={machForm.section_id}
                onChange={(e) => setMachForm({ ...machForm, section_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              >
                {store.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Line / Location</label>
              <input
                type="text"
                placeholder="e.g. Line 1 Cell A"
                value={machForm.line}
                onChange={(e) => setMachForm({ ...machForm, line: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Machine Type</label>
              <input
                type="text"
                placeholder="e.g. Vacuum Pump"
                value={machForm.machine_type}
                onChange={(e) => setMachForm({ ...machForm, machine_type: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g. Leybold"
                value={machForm.brand}
                onChange={(e) => setMachForm({ ...machForm, brand: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Model</label>
              <input
                type="text"
                placeholder="e.g. D65B"
                value={machForm.model}
                onChange={(e) => setMachForm({ ...machForm, model: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMachineModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              Save Machine Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD PROCESS */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Add Engineered Process Step"
        subtitle="Define sequence, cycle time, SAM and quality checks"
      >
        <form onSubmit={handleSaveProcess} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Process Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ultrasonic Terminal Welding"
              value={procForm.name}
              onChange={(e) => setProcForm({ ...procForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Section</label>
              <select
                value={procForm.section_id}
                onChange={(e) => setProcForm({ ...procForm, section_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              >
                {store.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sub Process</label>
              <input
                type="text"
                placeholder="e.g. Pinch & Cut"
                value={procForm.sub_process}
                onChange={(e) => setProcForm({ ...procForm, sub_process: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cycle Time (sec)</label>
              <input
                type="number"
                value={procForm.cycle_time_sec}
                onChange={(e) => setProcForm({ ...procForm, cycle_time_sec: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">SAM (sec)</label>
              <input
                type="number"
                value={procForm.sam_sec}
                onChange={(e) => setProcForm({ ...procForm, sam_sec: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-amber-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Manpower</label>
              <input
                type="number"
                value={procForm.manpower}
                onChange={(e) => setProcForm({ ...procForm, manpower: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Critical Quality Control (CQC)</label>
            <input
              type="text"
              placeholder="e.g. Leak rate < 0.5g/yr; torque 14.5 Nm"
              value={procForm.critical_parameters}
              onChange={(e) => setProcForm({ ...procForm, critical_parameters: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsProcessModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              Save Process Step
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: ADD CUSTOM FIELD ("EVERYTHING IS CONFIGURABLE") */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title="Create New Custom Field"
        subtitle="Add a dynamic parameter to any entity without modifying code"
      >
        <form onSubmit={handleSaveCustomField} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Entity *</label>
              <select
                value={fieldForm.target_entity}
                onChange={(e) => setFieldForm({ ...fieldForm, target_entity: e.target.value as TargetEntity })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-blue-700"
              >
                <option value="machine">Machine</option>
                <option value="process">Process</option>
                <option value="section">Section</option>
                <option value="part">Part</option>
                <option value="cost">Cost</option>
                <option value="capacity">Capacity</option>
                <option value="sam">SAM</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Field Data Type *</label>
              <select
                value={fieldForm.field_type}
                onChange={(e) => setFieldForm({ ...fieldForm, field_type: e.target.value as CustomFieldType })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              >
                <option value="text">Text</option>
                <option value="number">Number (Integer)</option>
                <option value="decimal">Decimal</option>
                <option value="dropdown">Dropdown Options</option>
                <option value="date">Date</option>
                <option value="checkbox">Checkbox (Boolean)</option>
                <option value="textarea">Textarea (Multi-line)</option>
                <option value="url">URL Link</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Field Name (Label) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gas Type, Power Consumption"
                value={fieldForm.field_name}
                onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Unit of Measurement</label>
              <input
                type="text"
                placeholder="e.g. kW, Bar, sec, °C"
                value={fieldForm.unit}
                onChange={(e) => setFieldForm({ ...fieldForm, unit: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono"
              />
            </div>
          </div>

          {fieldForm.field_type === 'dropdown' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Dropdown Options (Comma separated) *
              </label>
              <input
                type="text"
                placeholder="e.g. R32, R410A, R290, R22"
                value={fieldForm.optionsString}
                onChange={(e) => setFieldForm({ ...fieldForm, optionsString: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="field_req"
              checked={fieldForm.is_required}
              onChange={(e) => setFieldForm({ ...fieldForm, is_required: e.target.checked })}
              className="rounded text-blue-600"
            />
            <label htmlFor="field_req" className="text-xs font-medium text-slate-700">
              Required field in input forms
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setIsFieldModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              Create Field
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: ADD DYNAMIC TABLE */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title="Create New Custom Table"
        subtitle="Define an independent relational data table"
      >
        <form onSubmit={handleSaveCustomTable} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Table Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Calibration Logs, Chemical Bath Specs"
              value={tableForm.name}
              onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Target Entity</label>
            <select
              value={tableForm.target_entity}
              onChange={(e) => setTableForm({ ...tableForm, target_entity: e.target.value as TargetEntity })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-blue-700"
            >
              <option value="machine">Machine</option>
              <option value="process">Process</option>
              <option value="section">Section</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">First Column Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Parameter, Inspection Date"
              value={tableForm.firstColumnName}
              onChange={(e) => setTableForm({ ...tableForm, firstColumnName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setIsTableModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              Build Table
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading admin panel...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
