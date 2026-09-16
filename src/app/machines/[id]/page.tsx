'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Cpu,
  Calendar,
  Layers,
  Wrench,
  Camera,
  FileText,
  Table as TableIcon,
  Tag,
  Maximize2,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Settings2,
} from 'lucide-react';
import { store } from '../../../lib/store';
import { Badge } from '../../../components/ui/Badge';
import { LightboxModal } from '../../../components/ui/LightboxModal';
import { Machine, MachineImage, DocumentItem } from '../../../types';

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;
  const [, setTick] = useState(0);

  const [activeTab, setActiveTab] = useState<'specs' | 'photos' | 'tables' | 'documents'>('specs');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const machine = store.machines.find((m) => m.id === machineId);
  const section = machine ? store.sections.find((s) => s.id === machine.section_id) : null;
  const customFields = store.customFields.filter((cf) => cf.target_entity === 'machine');
  const customFieldValues = machine ? store.getFieldValuesForEntity('machine', machine.id) : {};
  const images = store.machineImages.filter((img) => img.machine_id === machineId);
  const documents = store.documents.filter(
    (d) => d.entity_type === 'machine' && d.entity_id === machineId
  );

  // Dynamic tables attached to this machine
  const customTables = store.customTables.filter((t) => t.target_entity === 'machine');
  const customRows = store.customTableRows.filter(
    (r) => r.entity_type === 'machine' && r.entity_id === machineId
  );

  if (!machine) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800">Machine Asset Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The machine record requested does not exist.</p>
        <Link
          href="/machines"
          className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Machines
        </Link>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxInitialIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/machines" className="hover:text-blue-600 flex items-center">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Machines
          </Link>
          <span>/</span>
          {section && (
            <>
              <Link href={`/sections/${section.id}`} className="hover:text-blue-600">
                {section.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="font-semibold text-slate-900">{machine.machine_id}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/machines/compare?ids=${machine.id}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Compare Machine
          </Link>
          <Link
            href={`/admin?action=edit-machine&id=${machine.id}`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-2xs"
          >
            Edit Asset
          </Link>
        </div>
      </div>

      {/* Main Asset Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-mono font-black text-white shadow-xs">
                {machine.machine_id}
              </span>
              <Badge
                variant={
                  machine.status === 'Active'
                    ? 'success'
                    : machine.status === 'Under Maintenance'
                    ? 'warning'
                    : 'danger'
                }
              >
                {machine.status}
              </Badge>
              <span className="text-xs font-semibold text-slate-400">
                Type: <span className="text-slate-700">{machine.machine_type}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {machine.name}
            </h1>

            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              {machine.description || 'Industrial production asset installed in Walton Air Conditioner plant.'}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
              <div>
                <span className="text-slate-400">Section:</span>{' '}
                <span className="font-bold text-slate-800">{section?.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400">Line:</span>{' '}
                <span className="font-bold text-slate-800">{machine.line}</span>
              </div>
              <div>
                <span className="text-slate-400">Brand / Model:</span>{' '}
                <span className="font-bold text-slate-800">
                  {machine.brand} {machine.model}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Serial No:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{machine.serial_number || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400">Installed:</span>{' '}
                <span className="font-bold text-slate-800">{machine.installation_date || '-'}</span>
              </div>
            </div>
          </div>

          {/* Machine Main Photo Preview */}
          {images.length > 0 && (
            <div
              onClick={() => openLightbox(0)}
              className="relative h-36 w-56 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-md cursor-pointer group"
            >
              <img
                src={images[0].image_url}
                alt={machine.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                <Maximize2 className="h-6 w-6" />
              </div>
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                {images.length} Photos
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'specs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Technical Specifications & Custom Fields</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'tables'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TableIcon className="h-4 w-4" />
          <span>Dynamic Tables ({customTables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'photos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Multi-Angle Photos ({images.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center space-x-2 border-b-2 py-4 px-4 text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Manuals & SOPs ({documents.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Technical Specs & Custom Fields */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {/* Dynamic Custom Fields Grid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-900">
                  Dynamic Technical Parameters (Custom Field Engine)
                </h3>
                <p className="text-xs text-slate-500">
                  Configured custom specifications without hardcoded database schema
                </p>
              </div>
              <Link
                href="/admin?action=new-field"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Configure New Field
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {customFields.map((field) => {
                const val = customFieldValues[field.field_key];
                return (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {field.field_name}
                      </span>
                      <p className="text-base font-extrabold text-slate-900 mt-1">
                        {val !== undefined && val !== '' ? (
                          <span>
                            {String(val)} {field.unit && <span className="text-xs text-blue-600 font-semibold">{field.unit}</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">Not specified</span>
                        )}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Type: {field.field_type}</span>
                      {field.is_required && <span className="text-rose-500 font-semibold">Required</span>}
                    </div>
                  </div>
                );
              })}

              {customFields.length === 0 && (
                <p className="col-span-full py-8 text-center text-xs text-slate-400">
                  No custom fields configured for machine assets.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Dynamic Tables */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {customTables.map((table) => {
            const columns = store.customTableColumns
              .filter((c) => c.table_id === table.id)
              .sort((a, b) => a.sort_order - b.sort_order);
            const rows = customRows.filter((r) => r.table_id === table.id);

            return (
              <div
                key={table.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase text-slate-900">{table.name}</h3>
                    {table.description && <p className="text-xs text-slate-500">{table.description}</p>}
                  </div>
                  <Link
                    href={`/admin?action=add-table-row&tableId=${table.id}&entityId=${machine.id}`}
                    className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                        {columns.map((col) => (
                          <th key={col.id} className="py-2.5 px-4">
                            {col.column_name} {col.unit && `(${col.unit})`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          {columns.map((col) => (
                            <td key={col.id} className="py-2.5 px-4 font-medium">
                              {r.data[col.column_key] !== undefined ? String(r.data[col.column_key]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={columns.length || 1} className="py-8 text-center text-slate-400 text-xs">
                            No rows added in this table for this machine yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Multi-Angle Photo Gallery */}
      {activeTab === 'photos' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-900">
                Machine Photo & Visual Inspection Gallery
              </h3>
              <p className="text-xs text-slate-500">
                Multi-angle photographic records (Control panel, Nameplate, Installation, Process position)
              </p>
            </div>
            <Link
              href={`/admin?action=upload-image&machineId=${machine.id}`}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Upload Photo
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => openLightbox(idx)}
                className="group relative h-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 cursor-pointer shadow-2xs hover:shadow-lg transition"
              >
                <img
                  src={img.image_url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-2 left-2 flex items-center space-x-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                  <Tag className="h-3 w-3 text-sky-400" />
                  <span>{img.view_type}</span>
                </div>
                {img.caption && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-medium text-white line-clamp-1">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}

            {images.length === 0 && (
              <p className="col-span-full py-12 text-center text-xs text-slate-400">
                No images attached to this machine asset yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. Documents & Manuals */}
      {activeTab === 'documents' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-900">Attached Documents & Manuals</h3>
              <p className="text-xs text-slate-500">Operation manuals, safety guides, and inspection sheets</p>
            </div>
            <Link
              href={`/admin?action=upload-doc&machineId=${machine.id}`}
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
              <p className="py-12 text-center text-xs text-slate-400">
                No documents currently attached to this machine.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        initialIndex={lightboxInitialIndex}
        machineName={machine.name}
      />
    </div>
  );
}
