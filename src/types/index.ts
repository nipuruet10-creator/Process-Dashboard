export type UserRole = 'admin' | 'engineer' | 'viewer' | 'management';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
}

export type SectionStatus = 'Active' | 'Inactive' | 'Maintenance';

export interface SubSection {
  id: string;
  name: string;
  code?: string;
  description?: string;
  responsible_person?: string;
  target_sam?: number;
}

export interface Section {
  id: string;
  code: string; // e.g. SEC-INDOOR, SEC-OUTDOOR-1, SEC-VAC
  name: string; // e.g. Indoor Assembly, Outdoor Assembly Line 1, Vacuum Station
  department: string; // e.g. Process Development & IE
  description?: string;
  responsible_person?: string;
  photo_url?: string;
  status: SectionStatus;
  sort_order: number;
  sub_sections?: SubSection[];
  target_oee?: number;
  line_speed?: string;
  target_takt_time_sec?: number;
  created_at: string;
  updated_at: string;
}

export type MachineStatus = 'Active' | 'Inactive' | 'Under Maintenance' | 'Decommissioned';

export interface Machine {
  id: string;
  machine_id: string; // e.g. TPM-01, FIN-01, TRU-01
  name: string;
  section_id: string;
  line: string; // e.g. Line 1, Main Line, Sub-assembly
  process_name?: string;
  sub_process?: string;
  machine_type: string; // Vacuum Pump, Gas Charging, Ultrasonic Welder, Brazing, etc.
  manufacturer?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  installation_date?: string;
  status: MachineStatus;
  description?: string;
  capacity_per_hr?: string;
  power_kw?: number;
  responsible_person?: string;
  spare_stock?: string;
  spare_details?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelOperation {
  id: string;
  model_code: string;
  section: string;
  operation_name: string;
  machine_manual: 'Machine' | 'Manual';
  machine_tag?: string;
  cycle_time_sec: number;
  capacity_per_hr: number;
  manpower: number;
  kwh?: number;
  air_m3_h?: number;
  area_sft?: number;
}

export interface ModelProcessCost {
  id: string;
  model_code: string;
  series: string;
  capacity_ton: string;
  source_file: string;
  operation_count: number;
  total_cycle_time_sec: number;
  sam_sec: number;
  total_manpower: number;
  utility_cost_bdt: number;
  manpower_cost_bdt: number;
  area_cost_bdt: number;
  mould_tooling_cost_bdt: number;
  total_process_cost_bdt: number;
  operations_sample?: ModelOperation[];
}

export interface HeatExchangerMatrix {
  id: string;
  capacity: string;
  series: string;
  version?: string;
  part_name: string;
  tube_dia: string;
  tube_thickness?: string;
  hairpin_count?: string;
  hairpin_length?: string;
  fin_thickness?: string;
  hole_count?: string;
  fin_configuration?: string;
  fin_quantity?: string;
}

export interface ProductionForecast {
  month: string;
  condenser_mfc: number;
  condenser_copper: number;
  evaporator_5mm: number;
  evaporator_7mm: number;
  total_coils: number;
}

export interface FinPressCapacity {
  id: string;
  product: string;
  machine: string;
  type: string;
  model: string;
  cycle_time_sec: number;
  capacity_per_hr: number;
  shift_hours: number;
  efficiency_pct: number;
  gross_shift_cap: number;
  effective_shift_cap: number;
}

export interface Process {
  id: string;
  name: string;
  section_id: string;
  machine_id?: string;
  line?: string;
  sub_process?: string;
  description?: string;
  input_spec?: string;
  output_spec?: string;
  manpower: number;
  cycle_time_sec: number;
  sam_sec: number;
  hourly_capacity: number;
  process_cost: number;
  quality_check?: string;
  critical_parameters?: string;
  sop_url?: string;
  work_instruction?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'textarea'
  | 'image'
  | 'file'
  | 'url';

export type TargetEntity = 'section' | 'machine' | 'process' | 'part' | 'cost' | 'capacity' | 'sam';

export interface CustomField {
  id: string;
  target_entity: TargetEntity;
  field_name: string;
  field_key: string;
  field_type: CustomFieldType;
  unit?: string;
  options?: string[]; // For dropdown
  is_required: boolean;
  default_value?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  field_id: string;
  entity_type: TargetEntity;
  entity_id: string;
  value: any;
  created_at: string;
  updated_at: string;
}

export interface CustomTable {
  id: string;
  name: string;
  slug: string;
  description?: string;
  target_entity: TargetEntity;
  is_system?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomTableColumn {
  id: string;
  table_id: string;
  column_name: string;
  column_key: string;
  data_type: 'text' | 'number' | 'decimal' | 'dropdown' | 'checkbox' | 'date';
  unit?: string;
  options?: string[];
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface CustomTableRow {
  id: string;
  table_id: string;
  entity_type: TargetEntity;
  entity_id: string;
  data: Record<string, any>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SAMRecord {
  id: string;
  section_id: string;
  process_id: string;
  machine_id?: string;
  operator_name?: string;
  sam_sec: number;
  manpower: number;
  efficiency_pct: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface CapacityRecord {
  id: string;
  section_id: string;
  process_id?: string;
  machine_id?: string;
  machine_capacity_hr: number;
  working_hours: number;
  shift_count: number;
  efficiency_pct: number;
  hourly_capacity: number;
  shift_capacity: number;
  daily_capacity: number;
  monthly_capacity: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export type CostCategory =
  | 'Manpower'
  | 'Machine'
  | 'Electricity'
  | 'Gas'
  | 'Consumables'
  | 'Maintenance'
  | 'Depreciation'
  | 'Other';

export interface CostRecord {
  id: string;
  section_id: string;
  process_id?: string;
  machine_id?: string;
  category: CostCategory;
  cost_amount: number;
  cost_unit: string;
  cost_per_piece: number;
  period: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface PartCost {
  id: string;
  model_name: string; // e.g. WAC-18IN-INV, WAC-24CAC, VRF-8HP
  part_name: string; // Compressor, Condenser, Evaporator, Copper Tube, 4-Way Valve, PCB
  section_id: string;
  process_id?: string;
  machine_id?: string;
  sam_sec: number;
  quantity: number;
  unit_cost: number;
  process_cost: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export type MachineImageViewType =
  | 'Main photo'
  | 'Front view'
  | 'Side view'
  | 'Control panel'
  | 'Nameplate'
  | 'Installation'
  | 'Process position'
  | 'Other';

export interface MachineImage {
  id: string;
  machine_id: string;
  image_url: string;
  view_type: MachineImageViewType;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export type DocumentCategory =
  | 'SOP'
  | 'Work Instruction'
  | 'Machine Manual'
  | 'Maintenance Manual'
  | 'Drawing'
  | 'Layout'
  | 'Specification Sheet'
  | 'Inspection Report'
  | 'Other';

export type DocumentFileType = 'PDF' | 'Excel' | 'Word' | 'Image' | 'Drawing' | 'Other';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  file_url: string;
  file_type: DocumentFileType;
  file_size_bytes: number;
  entity_type: 'section' | 'machine' | 'process' | 'department';
  entity_id: string;
  version: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string; // 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT'
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// KPI Dashboard Aggregate
export interface DashboardKPIs {
  totalSections: number;
  totalMachines: number;
  activeMachines: number;
  totalProcesses: number;
  totalDailyCapacity: number;
  averageSAMSec: number;
  totalProcessCost: number;
}
