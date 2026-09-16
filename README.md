# PROCESS DEVELOPMENT & INDUSTRIAL ENGINEERING INFORMATION SYSTEM

> **Enterprise Information System for Air Conditioner (AC) Manufacturing Process Engineering**  
> *Built for Walton Air Conditioner Manufacturing Complex • Process Development & IE Department*

---

## 🏭 System Architecture Overview

The system is engineered as a multi-tier industrial information management platform structured into four operational layers:

```
Dashboard  ──▶  Section  ──▶  Information Module  ──▶  Record Details
```

1. **Dashboard Layer**: Top-level factory KPIs, live machine uptime distribution, plant capacity comparison, bottleneck SAM curves, cost distributions, and global section registries.
2. **Section Layer**: Dedicated line dashboards (e.g. *Indoor Assembly, Outdoor Line 1, Vacuum, Gas Charging, Ageing, Ultrasonic, Brazing, Helium Leak Detection, Packing*) with multi-tab drilldowns:
   - `Overview` • `Machines` • `Processes` • `Cost` • `SAM` • `Capacity` • `Documents`
3. **Information Module Layer**: Specialized industrial engineering engines:
   - **SAM Module**: Work-study line balancing, bottleneck detection, cycle times.
   - **Capacity Module**: Interactive mathematical simulation factoring shift hours, shift counts, and OEE efficiency.
   - **Process Cost & Part-Wise Cost Module**: Category breakdown (Manpower, Machine, Electricity, Gas, Consumables, Maintenance, Depreciation) and model/component-level labor costs.
   - **Document Repository**: Centralized engineering storage for SOPs, Work Instructions, CAD drawings, and equipment manuals.
4. **Record Details Layer**: Industrial asset registry with multi-angle visual inspection photos (Main, Front, Side, Control Panel, Nameplate, Installation, Process Position), dynamic custom specifications, and custom tables.

---

## ⚙️ Core Principle: "Everything is Configurable"

Administrators can add, update, and customize factory structures **without modifying frontend source code or redeploying**:
- **Dynamic Custom Fields**: Add new fields (*Text, Number, Decimal, Date, Dropdown with custom options, Checkbox, Textarea, URL*) assigned to Machines, Processes, Sections, or Parts.
- **Dynamic Custom Tables**: Create custom tabular data structures (e.g. *Machine Specification, Process Parameters, Spare Parts & Maintenance*) with custom column data types, units, and row editors.
- **Excel Import Wizard**: Upload spreadsheets (`.xlsx`, `.csv`), select worksheets, map spreadsheet columns directly to system fields, preview, validate, and batch import.

---

## 💻 Tech Stack

- **Framework**: Next.js 15 (App Router with React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Industrial Dark Navy & Slate ERP theme)
- **Charts & Data Visualization**: Recharts (Responsive bar charts, vertical bottleneck charts, donut charts)
- **Database**: Supabase PostgreSQL with normalized schema (`supabase/schema.sql`), UUIDs, foreign keys, and Row Level Security (RLS)
- **Data Layer**: Dual-mode engine supporting remote Supabase and zero-latency reactive local persistence with full offline state retention
- **File & Spreadsheets**: ExcelJS & XLSX for high-fidelity Excel report generation and spreadsheet ingestion
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Installation

```bash
# Clone repository
git clone <your-repo-url>
cd process-development-ie-system

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your Supabase credentials (optional for initial local testing):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

*(Note: If Supabase keys are not set, the application automatically activates its offline reactive persistence engine preloaded with 10 Walton AC production sections, 20+ machines, and 30+ processes).*

### 3. Database Setup (Supabase PostgreSQL)

To set up the production PostgreSQL schema:
1. Open your Supabase project SQL Editor.
2. Run the SQL script located in `supabase/schema.sql`.
3. This creates all tables (`sections`, `machines`, `processes`, `custom_fields`, `custom_tables`, `sam_records`, `capacity_records`, `cost_records`, `part_costs`, `machine_images`, `documents`, `audit_logs`), triggers, indexes, and RLS policies.

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build Verification

```bash
npm run build
npm run start
```

---

## 🔒 Role-Based Access Control (RBAC)

The system enforces role-based access:
- **Admin**: Full access (Create, Edit, Delete, Custom Field & Table Builder, Excel Import, User Management).
- **Engineer**: Create and update engineering data, process parameters, and maintenance logs.
- **Management**: Executive dashboards, SAM line balancing analysis, and report exports.
- **Viewer**: Read-only access across all sections, machines, and documents.

Switch roles instantly using the user menu in the top navigation bar to test different permission levels.

---

## ☁️ Deployment on Vercel

1. Push this repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Add the environment variables from `.env.example` under **Project Settings > Environment Variables**.
4. Click **Deploy**. Vercel will automatically build the Next.js App Router application.
