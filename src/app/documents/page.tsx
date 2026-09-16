'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  ExternalLink,
  Tag,
  FileType,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { store } from '../../lib/store';
import { Badge } from '../../components/ui/Badge';
import { DocumentCategory, DocumentFileType } from '../../types';

export default function DocumentsPage() {
  const [, setTick] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  useEffect(() => {
    store.init();
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const documents = store.documents;
  const sections = store.sections;
  const machines = store.machines;

  const categories: DocumentCategory[] = [
    'SOP',
    'Work Instruction',
    'Machine Manual',
    'Maintenance Manual',
    'Drawing',
    'Layout',
    'Specification Sheet',
    'Inspection Report',
  ];

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.category.toLowerCase().includes(search.toLowerCase()) ||
      (doc.remarks && doc.remarks.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;
    const matchesType = typeFilter === 'All' || doc.file_type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  const getFileIcon = (fileType: DocumentFileType) => {
    switch (fileType) {
      case 'PDF':
        return <FileText className="h-5 w-5 text-rose-600" />;
      case 'Excel':
        return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
      case 'Image':
        return <ImageIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <FileCode className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Engineering Document Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centrally archived Standard Operating Procedures (SOPs), Work Instructions, CAD drawings, and machine manuals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin?action=upload-doc"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents, SOPs, manuals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Format:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            >
              <option value="All">All Formats</option>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="Word">Word</option>
              <option value="Image">Image</option>
              <option value="Drawing">Drawing / CAD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((doc) => {
          let attachedTo = 'General Plant';
          if (doc.entity_type === 'section') {
            const s = sections.find((sec) => sec.id === doc.entity_id);
            attachedTo = s ? `Section: ${s.name}` : 'Section Attached';
          } else if (doc.entity_type === 'machine') {
            const m = machines.find((mach) => mach.id === doc.entity_id);
            attachedTo = m ? `Machine: ${m.machine_id}` : 'Machine Attached';
          }

          return (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition hover:border-blue-300"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5 shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <Badge variant="outline" size="sm">
                    {doc.category}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-blue-600 font-semibold mt-1">{attachedTo}</p>
                  {doc.remarks && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.remarks}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Ver: {doc.version} • {doc.file_type}</span>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                >
                  <span>Open File</span>
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center border rounded-2xl bg-white">
            <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No documents found matching filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
