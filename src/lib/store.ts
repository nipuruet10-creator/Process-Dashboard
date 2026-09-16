'use client';

import {
  Section,
  Machine,
  Process,
  CustomField,
  CustomFieldValue,
  CustomTable,
  CustomTableColumn,
  CustomTableRow,
  SAMRecord,
  CapacityRecord,
  CostRecord,
  PartCost,
  MachineImage,
  DocumentItem,
  UserProfile,
  AuditLog,
  TargetEntity,
} from '../types';

import {
  SEED_USERS,
  SEED_SECTIONS,
  SEED_MACHINES,
  SEED_PROCESSES,
  SEED_CUSTOM_FIELDS,
  SEED_CUSTOM_FIELD_VALUES,
  SEED_CUSTOM_TABLES,
  SEED_CUSTOM_TABLE_COLUMNS,
  SEED_CUSTOM_TABLE_ROWS,
  SEED_SAM_RECORDS,
  SEED_CAPACITY_RECORDS,
  SEED_COST_RECORDS,
  SEED_PART_COSTS,
  SEED_MACHINE_IMAGES,
  SEED_DOCUMENTS,
} from '../data/seedData';

const STORE_KEY_PREFIX = 'walton_ie_v1_';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(STORE_KEY_PREFIX + key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn(`Failed to read ${key} from storage`, e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to storage`, e);
  }
}

class Store {
  private listeners: Set<() => void> = new Set();

  public users: UserProfile[] = SEED_USERS;
  public currentUser: UserProfile = SEED_USERS[0]; // Admin

  public sections: Section[] = [];
  public machines: Machine[] = [];
  public processes: Process[] = [];
  public customFields: CustomField[] = [];
  public customFieldValues: CustomFieldValue[] = [];
  public customTables: CustomTable[] = [];
  public customTableColumns: CustomTableColumn[] = [];
  public customTableRows: CustomTableRow[] = [];
  public samRecords: SAMRecord[] = [];
  public capacityRecords: CapacityRecord[] = [];
  public costRecords: CostRecord[] = [];
  public partCosts: PartCost[] = [];
  public machineImages: MachineImage[] = [];
  public documents: DocumentItem[] = [];
  public auditLogs: AuditLog[] = [];
  public isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init() {
    if (this.isInitialized) return;

    this.sections = loadFromStorage('sections', SEED_SECTIONS);
    this.machines = loadFromStorage('machines', SEED_MACHINES);
    this.processes = loadFromStorage('processes', SEED_PROCESSES);
    this.customFields = loadFromStorage('custom_fields', SEED_CUSTOM_FIELDS);
    this.customFieldValues = loadFromStorage('custom_field_values', SEED_CUSTOM_FIELD_VALUES);
    this.customTables = loadFromStorage('custom_tables', SEED_CUSTOM_TABLES);
    this.customTableColumns = loadFromStorage('custom_table_columns', SEED_CUSTOM_TABLE_COLUMNS);
    this.customTableRows = loadFromStorage('custom_table_rows', SEED_CUSTOM_TABLE_ROWS);
    this.samRecords = loadFromStorage('sam_records', SEED_SAM_RECORDS);
    this.capacityRecords = loadFromStorage('capacity_records', SEED_CAPACITY_RECORDS);
    this.costRecords = loadFromStorage('cost_records', SEED_COST_RECORDS);
    this.partCosts = loadFromStorage('part_costs', SEED_PART_COSTS);
    this.machineImages = loadFromStorage('machine_images', SEED_MACHINE_IMAGES);
    this.documents = loadFromStorage('documents', SEED_DOCUMENTS);
    this.auditLogs = loadFromStorage('audit_logs', [
      {
        id: 'log-seed-1',
        user_id: 'u-1',
        user_name: 'Engr. Sazzad Hossain',
        user_role: 'admin',
        action: 'INITIALIZE',
        entity_type: 'system',
        details: { message: 'AC Process Development Information System loaded successfully' },
        created_at: new Date().toISOString(),
      },
    ]);

    const savedUser = loadFromStorage<UserProfile>('current_user', SEED_USERS[0]);
    this.currentUser = savedUser;

    this.isInitialized = true;
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public logAudit(action: string, entity_type: string, entity_id?: string, details: Record<string, any> = {}) {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      user_role: this.currentUser.role,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    this.auditLogs = [newLog, ...this.auditLogs];
    saveToStorage('audit_logs', this.auditLogs);
    this.notify();
  }

  public setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    saveToStorage('current_user', user);
    this.logAudit('SWITCH_ROLE', 'user', user.id, { newRole: user.role, userName: user.full_name });
    this.notify();
  }

  // --- SECTIONS ---
  public addSection(data: Omit<Section, 'id' | 'created_at' | 'updated_at'>): Section {
    const newSec: Section = {
      ...data,
      id: 'sec-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.sections = [...this.sections, newSec];
    saveToStorage('sections', this.sections);
    this.logAudit('CREATE', 'section', newSec.id, { name: newSec.name, code: newSec.code });
    this.notify();
    return newSec;
  }

  public updateSection(id: string, data: Partial<Section>): Section | null {
    const idx = this.sections.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.sections[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.sections = [
      ...this.sections.slice(0, idx),
      updated,
      ...this.sections.slice(idx + 1),
    ];
    saveToStorage('sections', this.sections);
    this.logAudit('UPDATE', 'section', id, data);
    this.notify();
    return updated;
  }

  public deleteSection(id: string) {
    const target = this.sections.find((s) => s.id === id);
    this.sections = this.sections.filter((s) => s.id !== id);
    saveToStorage('sections', this.sections);
    this.logAudit('DELETE', 'section', id, { name: target?.name });
    this.notify();
  }

  // --- MACHINES ---
  public addMachine(data: Omit<Machine, 'id' | 'created_at' | 'updated_at'>): Machine {
    const newMach: Machine = {
      ...data,
      id: 'm-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.machines = [...this.machines, newMach];
    saveToStorage('machines', this.machines);
    this.logAudit('CREATE', 'machine', newMach.id, { machine_id: newMach.machine_id, name: newMach.name });
    this.notify();
    return newMach;
  }

  public updateMachine(id: string, data: Partial<Machine>): Machine | null {
    const idx = this.machines.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.machines[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.machines = [
      ...this.machines.slice(0, idx),
      updated,
      ...this.machines.slice(idx + 1),
    ];
    saveToStorage('machines', this.machines);
    this.logAudit('UPDATE', 'machine', id, data);
    this.notify();
    return updated;
  }

  public deleteMachine(id: string) {
    const target = this.machines.find((m) => m.id === id);
    this.machines = this.machines.filter((m) => m.id !== id);
    saveToStorage('machines', this.machines);
    this.logAudit('DELETE', 'machine', id, { machine_id: target?.machine_id, name: target?.name });
    this.notify();
  }

  // --- PROCESSES ---
  public addProcess(data: Omit<Process, 'id' | 'created_at' | 'updated_at'>): Process {
    const newProc: Process = {
      ...data,
      id: 'proc-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.processes = [...this.processes, newProc];
    saveToStorage('processes', this.processes);
    this.logAudit('CREATE', 'process', newProc.id, { name: newProc.name, sam_sec: newProc.sam_sec });
    this.notify();
    return newProc;
  }

  public updateProcess(id: string, data: Partial<Process>): Process | null {
    const idx = this.processes.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.processes[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.processes = [
      ...this.processes.slice(0, idx),
      updated,
      ...this.processes.slice(idx + 1),
    ];
    saveToStorage('processes', this.processes);
    this.logAudit('UPDATE', 'process', id, data);
    this.notify();
    return updated;
  }

  public deleteProcess(id: string) {
    const target = this.processes.find((p) => p.id === id);
    this.processes = this.processes.filter((p) => p.id !== id);
    saveToStorage('processes', this.processes);
    this.logAudit('DELETE', 'process', id, { name: target?.name });
    this.notify();
  }

  // --- CUSTOM FIELDS (CONFIGURABLE ARCHITECTURE) ---
  public addCustomField(data: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>): CustomField {
    const newField: CustomField = {
      ...data,
      id: 'cf-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.customFields = [...this.customFields, newField];
    saveToStorage('custom_fields', this.customFields);
    this.logAudit('CREATE', 'custom_field', newField.id, {
      name: newField.field_name,
      entity: newField.target_entity,
      type: newField.field_type,
    });
    this.notify();
    return newField;
  }

  public updateCustomField(id: string, data: Partial<CustomField>): CustomField | null {
    const idx = this.customFields.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.customFields[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.customFields = [
      ...this.customFields.slice(0, idx),
      updated,
      ...this.customFields.slice(idx + 1),
    ];
    saveToStorage('custom_fields', this.customFields);
    this.logAudit('UPDATE', 'custom_field', id, data);
    this.notify();
    return updated;
  }

  public deleteCustomField(id: string) {
    const target = this.customFields.find((f) => f.id === id);
    this.customFields = this.customFields.filter((f) => f.id !== id);
    this.customFieldValues = this.customFieldValues.filter((v) => v.field_id !== id);
    saveToStorage('custom_fields', this.customFields);
    saveToStorage('custom_field_values', this.customFieldValues);
    this.logAudit('DELETE', 'custom_field', id, { name: target?.field_name });
    this.notify();
  }

  public setCustomFieldValue(field_id: string, entity_type: TargetEntity, entity_id: string, value: any) {
    const idx = this.customFieldValues.findIndex(
      (v) => v.field_id === field_id && v.entity_type === entity_type && v.entity_id === entity_id
    );

    if (idx >= 0) {
      this.customFieldValues[idx] = {
        ...this.customFieldValues[idx],
        value,
        updated_at: new Date().toISOString(),
      };
    } else {
      this.customFieldValues.push({
        id: 'cfv-' + Date.now(),
        field_id,
        entity_type,
        entity_id,
        value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    saveToStorage('custom_field_values', this.customFieldValues);
    this.notify();
  }

  public getFieldValuesForEntity(entity_type: TargetEntity, entity_id: string): Record<string, any> {
    const result: Record<string, any> = {};
    const relevantValues = this.customFieldValues.filter(
      (v) => v.entity_type === entity_type && v.entity_id === entity_id
    );

    for (const val of relevantValues) {
      const field = this.customFields.find((f) => f.id === val.field_id);
      if (field) {
        result[field.field_key] = val.value;
      }
    }
    return result;
  }

  // --- DYNAMIC CUSTOM TABLES ---
  public addCustomTable(data: Omit<CustomTable, 'id' | 'created_at' | 'updated_at'>): CustomTable {
    const newTbl: CustomTable = {
      ...data,
      id: 'tbl-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.customTables = [...this.customTables, newTbl];
    saveToStorage('custom_tables', this.customTables);
    this.logAudit('CREATE', 'custom_table', newTbl.id, { name: newTbl.name, slug: newTbl.slug });
    this.notify();
    return newTbl;
  }

  public deleteCustomTable(id: string) {
    this.customTables = this.customTables.filter((t) => t.id !== id);
    this.customTableColumns = this.customTableColumns.filter((c) => c.table_id !== id);
    this.customTableRows = this.customTableRows.filter((r) => r.table_id !== id);
    saveToStorage('custom_tables', this.customTables);
    saveToStorage('custom_table_columns', this.customTableColumns);
    saveToStorage('custom_table_rows', this.customTableRows);
    this.logAudit('DELETE', 'custom_table', id);
    this.notify();
  }

  public addTableColumn(table_id: string, data: Omit<CustomTableColumn, 'id' | 'table_id' | 'created_at'>): CustomTableColumn {
    const newCol: CustomTableColumn = {
      ...data,
      id: 'col-' + Date.now(),
      table_id,
      created_at: new Date().toISOString(),
    };
    this.customTableColumns = [...this.customTableColumns, newCol];
    saveToStorage('custom_table_columns', this.customTableColumns);
    this.logAudit('CREATE', 'custom_table_column', newCol.id, { column_name: newCol.column_name });
    this.notify();
    return newCol;
  }

  public deleteTableColumn(column_id: string) {
    this.customTableColumns = this.customTableColumns.filter((c) => c.id !== column_id);
    saveToStorage('custom_table_columns', this.customTableColumns);
    this.notify();
  }

  public addTableRow(table_id: string, entity_type: TargetEntity, entity_id: string, data: Record<string, any>): CustomTableRow {
    const newRow: CustomTableRow = {
      id: 'row-' + Date.now(),
      table_id,
      entity_type,
      entity_id,
      data,
      sort_order: this.customTableRows.filter((r) => r.table_id === table_id && r.entity_id === entity_id).length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.customTableRows = [...this.customTableRows, newRow];
    saveToStorage('custom_table_rows', this.customTableRows);
    this.notify();
    return newRow;
  }

  public updateTableRow(row_id: string, data: Record<string, any>): CustomTableRow | null {
    const idx = this.customTableRows.findIndex((r) => r.id === row_id);
    if (idx === -1) return null;
    const updated = {
      ...this.customTableRows[idx],
      data,
      updated_at: new Date().toISOString(),
    };
    this.customTableRows = [
      ...this.customTableRows.slice(0, idx),
      updated,
      ...this.customTableRows.slice(idx + 1),
    ];
    saveToStorage('custom_table_rows', this.customTableRows);
    this.notify();
    return updated;
  }

  public deleteTableRow(row_id: string) {
    this.customTableRows = this.customTableRows.filter((r) => r.id !== row_id);
    saveToStorage('custom_table_rows', this.customTableRows);
    this.notify();
  }

  // --- SAM & CAPACITY ---
  public addSAMRecord(data: Omit<SAMRecord, 'id' | 'created_at' | 'updated_at'>): SAMRecord {
    const rec: SAMRecord = {
      ...data,
      id: 'sam-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.samRecords = [...this.samRecords, rec];
    saveToStorage('sam_records', this.samRecords);
    this.notify();
    return rec;
  }

  public addCapacityRecord(data: Omit<CapacityRecord, 'id' | 'created_at' | 'updated_at'>): CapacityRecord {
    const rec: CapacityRecord = {
      ...data,
      id: 'cap-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.capacityRecords = [...this.capacityRecords, rec];
    saveToStorage('capacity_records', this.capacityRecords);
    this.notify();
    return rec;
  }

  // --- COSTS & PARTS ---
  public addCostRecord(data: Omit<CostRecord, 'id' | 'created_at' | 'updated_at'>): CostRecord {
    const rec: CostRecord = {
      ...data,
      id: 'cost-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.costRecords = [...this.costRecords, rec];
    saveToStorage('cost_records', this.costRecords);
    this.notify();
    return rec;
  }

  public addPartCost(data: Omit<PartCost, 'id' | 'created_at' | 'updated_at'>): PartCost {
    const rec: PartCost = {
      ...data,
      id: 'pc-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.partCosts = [...this.partCosts, rec];
    saveToStorage('part_costs', this.partCosts);
    this.notify();
    return rec;
  }

  // --- IMAGES & DOCUMENTS ---
  public addMachineImage(data: Omit<MachineImage, 'id' | 'created_at'>): MachineImage {
    const img: MachineImage = {
      ...data,
      id: 'img-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.machineImages = [...this.machineImages, img];
    saveToStorage('machine_images', this.machineImages);
    this.notify();
    return img;
  }

  public deleteMachineImage(id: string) {
    this.machineImages = this.machineImages.filter((i) => i.id !== id);
    saveToStorage('machine_images', this.machineImages);
    this.notify();
  }

  public addDocument(data: Omit<DocumentItem, 'id' | 'created_at' | 'updated_at'>): DocumentItem {
    const doc: DocumentItem = {
      ...data,
      id: 'doc-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.documents = [...this.documents, doc];
    saveToStorage('documents', this.documents);
    this.logAudit('UPLOAD', 'document', doc.id, { title: doc.title, category: doc.category });
    this.notify();
    return doc;
  }

  public deleteDocument(id: string) {
    this.documents = this.documents.filter((d) => d.id !== id);
    saveToStorage('documents', this.documents);
    this.logAudit('DELETE', 'document', id);
    this.notify();
  }

  // --- RESET TO DEMO DATA ---
  public resetToSeedData() {
    this.sections = SEED_SECTIONS;
    this.machines = SEED_MACHINES;
    this.processes = SEED_PROCESSES;
    this.customFields = SEED_CUSTOM_FIELDS;
    this.customFieldValues = SEED_CUSTOM_FIELD_VALUES;
    this.customTables = SEED_CUSTOM_TABLES;
    this.customTableColumns = SEED_CUSTOM_TABLE_COLUMNS;
    this.customTableRows = SEED_CUSTOM_TABLE_ROWS;
    this.samRecords = SEED_SAM_RECORDS;
    this.capacityRecords = SEED_CAPACITY_RECORDS;
    this.costRecords = SEED_COST_RECORDS;
    this.partCosts = SEED_PART_COSTS;
    this.machineImages = SEED_MACHINE_IMAGES;
    this.documents = SEED_DOCUMENTS;
    this.currentUser = SEED_USERS[0];

    saveToStorage('sections', this.sections);
    saveToStorage('machines', this.machines);
    saveToStorage('processes', this.processes);
    saveToStorage('custom_fields', this.customFields);
    saveToStorage('custom_field_values', this.customFieldValues);
    saveToStorage('custom_tables', this.customTables);
    saveToStorage('custom_table_columns', this.customTableColumns);
    saveToStorage('custom_table_rows', this.customTableRows);
    saveToStorage('sam_records', this.samRecords);
    saveToStorage('capacity_records', this.capacityRecords);
    saveToStorage('cost_records', this.costRecords);
    saveToStorage('part_costs', this.partCosts);
    saveToStorage('machine_images', this.machineImages);
    saveToStorage('documents', this.documents);
    saveToStorage('current_user', this.currentUser);

    this.logAudit('RESET', 'system', undefined, { message: 'Database reset to default AC factory seed data' });
    this.notify();
  }
}

export const store = new Store();
