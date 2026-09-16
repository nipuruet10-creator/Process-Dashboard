'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Cpu,
  Grid,
  Workflow,
  FileText,
  Boxes,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { store } from '../../lib/store';
import { Machine, Section, Process, DocumentItem, PartCost } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'machines' | 'sections' | 'processes' | 'documents'>('all');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search matches
  const matchedSections: Section[] = q
    ? store.sections.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      )
    : [];

  const matchedMachines: Machine[] = q
    ? store.machines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.machine_id.toLowerCase().includes(q) ||
          (m.model && m.model.toLowerCase().includes(q)) ||
          (m.brand && m.brand.toLowerCase().includes(q)) ||
          (m.manufacturer && m.manufacturer.toLowerCase().includes(q)) ||
          m.machine_type.toLowerCase().includes(q)
      )
    : [];

  const matchedProcesses: Process[] = q
    ? store.processes.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sub_process && p.sub_process.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.critical_parameters && p.critical_parameters.toLowerCase().includes(q))
      )
    : [];

  const matchedDocuments: DocumentItem[] = q
    ? store.documents.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.file_type.toLowerCase().includes(q)
      )
    : [];

  const matchedParts: PartCost[] = q
    ? store.partCosts.filter(
        (p) =>
          p.part_name.toLowerCase().includes(q) ||
          p.model_name.toLowerCase().includes(q)
      )
    : [];

  const totalMatches =
    matchedSections.length +
    matchedMachines.length +
    matchedProcesses.length +
    matchedDocuments.length +
    matchedParts.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
          <Search className="h-5 w-5 text-blue-600 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search machines, machine ID (e.g. VAC-01, GAS-01), sections, processes, SOPs..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 mr-1">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-slate-100">
          {!q && (
            <div className="py-12 text-center text-slate-400">
              <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Type to search factory information</p>
              <p className="text-xs text-slate-400 mt-1">
                Quick examples: <span className="font-semibold text-blue-600">VAC-01</span>,{' '}
                <span className="font-semibold text-blue-600">Gas Charging</span>,{' '}
                <span className="font-semibold text-blue-600">Ultrasonic</span>,{' '}
                <span className="font-semibold text-blue-600">Brazing</span>
              </p>
            </div>
          )}

          {q && totalMatches === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-600">No records found matching "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try another keyword, ID or parameter</p>
            </div>
          )}

          {/* Machine Matches */}
          {matchedMachines.length > 0 && (
            <div className="py-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                <Cpu className="h-4 w-4" />
                <span>Machines ({matchedMachines.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedMachines.map((m) => (
                  <Link
                    key={m.id}
                    href={`/machines/${m.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-blue-50/60 transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                          {m.machine_id}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                          {m.name}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">
                          {m.brand} {m.model}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{m.line}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Section Matches */}
          {matchedSections.length > 0 && (
            <div className="py-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                <Grid className="h-4 w-4" />
                <span>Sections ({matchedSections.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedSections.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sections/${s.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-emerald-50/60 transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          {s.code}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                          {s.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Process Matches */}
          {matchedProcesses.length > 0 && (
            <div className="py-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                <Workflow className="h-4 w-4" />
                <span>Processes ({matchedProcesses.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedProcesses.map((p) => (
                  <Link
                    key={p.id}
                    href="/processes"
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-indigo-50/60 transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
                          {p.name}
                        </span>
                        <span className="text-xs rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-medium">
                          SAM: {p.sam_sec}s
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Document Matches */}
          {matchedDocuments.length > 0 && (
            <div className="py-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                <FileText className="h-4 w-4" />
                <span>Documents & SOPs ({matchedDocuments.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedDocuments.map((d) => (
                  <Link
                    key={d.id}
                    href="/documents"
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-amber-50/60 transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
                          {d.category}
                        </span>
                        <span className="text-sm font-medium text-slate-900 group-hover:text-amber-700">
                          {d.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {d.file_type} • Version {d.version}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-right text-xs text-slate-400">
          Press <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-mono">ESC</kbd> to close
        </div>
      </div>
    </div>
  );
};
