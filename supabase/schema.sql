-- ==============================================================================
-- PROCESS DEVELOPMENT & INDUSTRIAL ENGINEERING INFORMATION SYSTEM
-- Database Schema for AC Manufacturing Process Engineering
-- Supabase PostgreSQL with RLS, UUIDs, Foreign Keys, Audit Logs & Indexes
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ROLES & PROFILES
CREATE TABLE IF NOT EXISTS users_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'viewer', 'management')),
    department TEXT DEFAULT 'Process Development',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT DEFAULT 'Process Development',
    description TEXT,
    responsible_person TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MACHINES TABLE (Industrial Asset Records)
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id TEXT UNIQUE NOT NULL, -- e.g. VAC-01, GAS-02
    name TEXT NOT NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    line TEXT NOT NULL,
    process_name TEXT,
    sub_process TEXT,
    machine_type TEXT NOT NULL,
    manufacturer TEXT,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    installation_date DATE,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Under Maintenance', 'Decommissioned')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROCESSES TABLE
CREATE TABLE IF NOT EXISTS processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    sub_process TEXT,
    description TEXT,
    input_spec TEXT,
    output_spec TEXT,
    manpower INT DEFAULT 1,
    cycle_time_sec NUMERIC(10, 2) DEFAULT 0,
    sam_sec NUMERIC(10, 2) DEFAULT 0,
    hourly_capacity NUMERIC(10, 2) DEFAULT 0,
    process_cost NUMERIC(12, 2) DEFAULT 0,
    quality_check TEXT,
    critical_parameters TEXT,
    sop_url TEXT,
    work_instruction TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOM FIELDS (Configurable Metadata Engine)
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_entity TEXT NOT NULL CHECK (target_entity IN ('section', 'machine', 'process', 'part', 'cost', 'capacity', 'sam')),
    field_name TEXT NOT NULL,
    field_key TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'decimal', 'date', 'dropdown', 'checkbox', 'textarea', 'image', 'file', 'url')),
    unit TEXT,
    options JSONB DEFAULT '[]'::jsonb, -- Options for dropdowns
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(target_entity, field_key)
);

-- 6. CUSTOM FIELD VALUES
CREATE TABLE IF NOT EXISTS custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_id, entity_type, entity_id)
);

-- 7. DYNAMIC CUSTOM TABLES
CREATE TABLE IF NOT EXISTS custom_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    target_entity TEXT NOT NULL DEFAULT 'machine',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CUSTOM TABLE COLUMNS
CREATE TABLE IF NOT EXISTS custom_table_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES custom_tables(id) ON DELETE CASCADE,
    column_name TEXT NOT NULL,
    column_key TEXT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('text', 'number', 'decimal', 'dropdown', 'checkbox', 'date')),
    unit TEXT,
    options JSONB DEFAULT '[]'::jsonb,
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CUSTOM TABLE ROWS
CREATE TABLE IF NOT EXISTS custom_table_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES custom_tables(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL DEFAULT 'machine',
    entity_id UUID NOT NULL,
    data JSONB NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SAM RECORDS
CREATE TABLE IF NOT EXISTS sam_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    operator_name TEXT,
    sam_sec NUMERIC(10, 2) NOT NULL,
    manpower INT DEFAULT 1,
    efficiency_pct NUMERIC(5, 2) DEFAULT 85.0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CAPACITY RECORDS
CREATE TABLE IF NOT EXISTS capacity_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    machine_capacity_hr NUMERIC(10, 2) NOT NULL,
    working_hours NUMERIC(5, 2) DEFAULT 8.0,
    shift_count INT DEFAULT 2,
    efficiency_pct NUMERIC(5, 2) DEFAULT 85.0,
    hourly_capacity NUMERIC(10, 2) NOT NULL,
    shift_capacity NUMERIC(10, 2) NOT NULL,
    daily_capacity NUMERIC(10, 2) NOT NULL,
    monthly_capacity NUMERIC(10, 2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. COST RECORDS
CREATE TABLE IF NOT EXISTS cost_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('Manpower', 'Machine', 'Electricity', 'Gas', 'Consumables', 'Maintenance', 'Depreciation', 'Other')),
    cost_amount NUMERIC(12, 2) NOT NULL,
    cost_unit TEXT DEFAULT 'BDT',
    cost_per_piece NUMERIC(10, 2) DEFAULT 0,
    period TEXT DEFAULT 'Monthly',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. PART WISE PROCESS COSTS
CREATE TABLE IF NOT EXISTS part_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL,
    part_name TEXT NOT NULL,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    sam_sec NUMERIC(10, 2) DEFAULT 0,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit_cost NUMERIC(12, 2) DEFAULT 0,
    process_cost NUMERIC(12, 2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MACHINE IMAGES (Multi-angle photos & gallery)
CREATE TABLE IF NOT EXISTS machine_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    view_type TEXT NOT NULL CHECK (view_type IN ('Main photo', 'Front view', 'Side view', 'Control panel', 'Nameplate', 'Installation', 'Process position', 'Other')),
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. DOCUMENTS REPOSITORY
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('SOP', 'Work Instruction', 'Machine Manual', 'Maintenance Manual', 'Drawing', 'Layout', 'Specification Sheet', 'Inspection Report', 'Other')),
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('PDF', 'Excel', 'Word', 'Image', 'Other')),
    file_size_bytes BIGINT DEFAULT 0,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('section', 'machine', 'process', 'department')),
    entity_id UUID NOT NULL,
    version TEXT DEFAULT '1.0',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'system',
    user_name TEXT DEFAULT 'Admin',
    user_role TEXT DEFAULT 'admin',
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, IMPORT, EXPORT
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_machines_section ON machines(section_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_processes_section ON processes(section_id);
CREATE INDEX IF NOT EXISTS idx_processes_machine ON processes(machine_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_target ON custom_fields(target_entity);
CREATE INDEX IF NOT EXISTS idx_cfv_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ctr_entity ON custom_table_rows(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sam_section ON sam_records(section_id);
CREATE INDEX IF NOT EXISTS idx_capacity_section ON capacity_records(section_id);
CREATE INDEX IF NOT EXISTS idx_cost_section ON cost_records(section_id);
CREATE INDEX IF NOT EXISTS idx_part_costs_model ON part_costs(model_name);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- TRIGGER FOR UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to major tables
DO $$
BEGIN
    CREATE TRIGGER update_sections_timestamp BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    CREATE TRIGGER update_machines_timestamp BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    CREATE TRIGGER update_processes_timestamp BEFORE UPDATE ON processes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    CREATE TRIGGER update_custom_fields_timestamp BEFORE UPDATE ON custom_fields FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    CREATE TRIGGER update_cost_records_timestamp BEFORE UPDATE ON cost_records FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_table_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_table_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users and public (viewer role)
CREATE POLICY "Public and authenticated read sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read machines" ON machines FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read processes" ON processes FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read custom_fields" ON custom_fields FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read custom_field_values" ON custom_field_values FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read custom_tables" ON custom_tables FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read custom_table_columns" ON custom_table_columns FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read custom_table_rows" ON custom_table_rows FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read sam_records" ON sam_records FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read capacity_records" ON capacity_records FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read cost_records" ON cost_records FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read part_costs" ON part_costs FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read machine_images" ON machine_images FOR SELECT USING (true);
CREATE POLICY "Public and authenticated read documents" ON documents FOR SELECT USING (true);

-- Allow write operations for authenticated users (Admin / Engineer)
CREATE POLICY "Authenticated insert sections" ON sections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update sections" ON sections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete sections" ON sections FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert machines" ON machines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update machines" ON machines FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete machines" ON machines FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert processes" ON processes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update processes" ON processes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete processes" ON processes FOR DELETE USING (auth.role() = 'authenticated');
