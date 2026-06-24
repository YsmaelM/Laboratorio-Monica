# Clinical Laboratory Results Reporting — Implementation Plan

> **Stack**: React 18 + TypeScript · Tailwind CSS v3 · Firebase (Firestore, Auth, Storage) · @react-pdf/renderer
>
> **Scope**: Single-tenant (one lab) · Single role (full access) · Editable reference ranges & units · Logo/letterhead to be added later

---

## 1. Firestore Schema

### 1.1 `patients` Collection

```
/patients/{patientId}
```

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Auto-generated or national ID |
| `nationalId` | `string` | Government ID / cédula (indexed for fast lookup) |
| `firstName` | `string` | |
| `lastName` | `string` | |
| `dateOfBirth` | `Timestamp` | |
| `sex` | `"M" \| "F"` | |
| `phone` | `string?` | Optional |
| `email` | `string?` | Optional |
| `address` | `string?` | Optional |
| `createdAt` | `Timestamp` | |
| `updatedAt` | `Timestamp` | |

> [!TIP]
> Index `nationalId` for the fast-search in Step 1. A composite index on `lastName + firstName` is also useful for partial-name lookups.

---

### 1.1b `lab_config` Document (Single-Tenant)

Since this is a single-lab system, lab info lives in a single config document.

```
/config/lab
```

| Field | Type | Description |
|---|---|---|
| `labName` | `string` | Laboratory name for letterhead |
| `address` | `string` | |
| `phone` | `string` | |
| `licenseNumber` | `string?` | Lab license / RNC |
| `logoUrl` | `string?` | Firebase Storage URL (empty until uploaded) |
| `letterheadUrl` | `string?` | Optional background image |
| `footerText` | `string?` | Disclaimer / signature line text |

---

### 1.2 `test_catalog` Collection

Serves as the master definition for every orderable test/profile. Each document carries a `format` discriminator that drives the UI factory.

```
/test_catalog/{catalogId}
```

| Field | Type | Description |
|---|---|---|
| `id` | `string` | |
| `name` | `string` | Display name ("Hematología Completa") |
| `code` | `string` | Short code ("HEM-01") |
| `format` | `"simple" \| "hematology" \| "urinalysis" \| "stool" \| "culture"` | **Discriminator** |
| `category` | `string` | Grouping label ("Química", "Microbiología") |
| `isQuickAction` | `boolean` | `true` → shows as Quick-Action button |
| `simpleDefaults` | `SimpleTestDefaults?` | Only when `format === "simple"` |
| `profileTemplate` | `ProfileTemplate?` | Only when `format !== "simple"` |
| `active` | `boolean` | Soft-delete flag |
| `order` | `number` | Sort order within category |

#### `SimpleTestDefaults` (embedded)

```ts
{
  unit: string;           // "mg/dL"  ← editable by user
  method: string;         // "Enzymatic" ← editable by user
  refRanges: {            // keyed by demographic — fully editable
    male:   { min: number; max: number };
    female: { min: number; max: number };
    child?: { min: number; max: number };
  };
}
```

#### `ProfileTemplate` (embedded)

```ts
{
  sections: Array<{
    sectionName: string;            // "Eritrograma"
    fields: Array<{
      key: string;                  // "wbc"
      label: string;               // "Leucocitos"
      inputType: "number" | "text" | "select" | "textarea";
      options?: string[];           // for selects / dropdowns
      unit?: string;
      refRanges?: RefRange;
      defaultValue?: string | number;
    }>;
  }>;
}
```

> [!IMPORTANT]
> The `profileTemplate` acts as a **schema-on-read** definition. The entry form in Step 3 is rendered entirely from this template, making the system extensible without code changes for new profile types.
>
> All `unit`, `refRanges`, and `method` values are **editable** through the Test Catalog Management screen. When a method changes, the lab tech updates the catalog and all future orders use the new values.

---

### 1.3 `orders_results` Collection (Polymorphic)

Each document is **one order** for **one patient visit**. It contains an array of `tests[]`, each carrying its own `format` discriminator and polymorphic `data` payload.

```
/orders_results/{orderId}
```

| Field | Type | Description |
|---|---|---|
| `id` | `string` | |
| `patientId` | `string` | FK → `patients` |
| `patientSnapshot` | `PatientSnapshot` | Denormalized name, sex, DOB at order time |
| `orderDate` | `Timestamp` | |
| `status` | `"draft" \| "in_progress" \| "completed" \| "reported"` | |
| `referringDoctor` | `string?` | |
| `tests` | `TestEntry[]` | Array of polymorphic test entries |
| `pdfUrl` | `string?` | Firebase Storage URL after generation |
| `createdBy` | `string` | Auth UID |
| `createdAt` | `Timestamp` | |
| `updatedAt` | `Timestamp` | |

#### `TestEntry` — Polymorphic Union

```ts
interface TestEntryBase {
  catalogId: string;
  testName: string;
  format: "simple" | "hematology" | "urinalysis" | "stool" | "culture";
  status: "pending" | "entered" | "validated";
}

// ── Simple ──────────────────────────────────────────────
interface SimpleTestEntry extends TestEntryBase {
  format: "simple";
  data: {
    result: string | number;
    unit: string;
    refRange: string;       // "70 - 110"
    method: string;
    flag?: "H" | "L" | "N"; // High / Low / Normal
  };
}

// ── Hematology ──────────────────────────────────────────
interface HematologyEntry extends TestEntryBase {
  format: "hematology";
  data: {
    sections: Array<{
      sectionName: string;
      results: Array<{
        key: string;
        label: string;
        value: string | number;
        unit: string;
        refRange: string;
        flag?: "H" | "L" | "N";
      }>;
    }>;
    smearNotes?: string;    // Peripheral smear observations
  };
}

// ── Urinalysis ──────────────────────────────────────────
interface UrinalysisEntry extends TestEntryBase {
  format: "urinalysis";
  data: {
    physical: Record<string, string>;    // color, appearance, density
    chemical: Record<string, string>;    // pH, protein, glucose, etc.
    microscopic: Record<string, string>; // RBC, WBC, casts, crystals (e.g. "0-2 hpf")
  };
}

// ── Stool ───────────────────────────────────────────────
interface StoolEntry extends TestEntryBase {
  format: "stool";
  data: {
    macroscopic: Record<string, string>; // color, consistency, mucus, blood
    microscopic: Record<string, string>; // parasites, WBC, RBC, fat
    chemical: Record<string, string>;    // occult blood, pH
  };
}

// ── Culture & Antibiogram ───────────────────────────────
interface CultureEntry extends TestEntryBase {
  format: "culture";
  data: {
    sampleType: string;          // "Urine", "Blood", "Wound"
    gramStain?: string;
    cultureResult: string;       // "Positive" | "Negative" | organism name
    organism?: string;
    colonyCount?: string;        // ">100,000 CFU/mL"
    antibiogram?: Array<{
      antibiotic: string;
      result: "S" | "I" | "R"; // Sensitive / Intermediate / Resistant
      mic?: string;             // optional MIC value
    }>;
    notes?: string;
  };
}

type TestEntry =
  | SimpleTestEntry
  | HematologyEntry
  | UrinalysisEntry
  | StoolEntry
  | CultureEntry;
```

> [!NOTE]
> **Why embed tests in the order document?** A typical lab order has 1–15 tests. Embedding avoids N+1 reads when generating the PDF or displaying results. Firestore's 1 MiB document limit is never a concern at this scale.

---

## 2. React Architecture

### 2.1 Folder Structure

```
src/
├── app/                          # App shell, routing, providers
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
│       ├── AuthProvider.tsx
│       └── FirebaseProvider.tsx
│
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   └── LoginPage.tsx
│   │   └── components/
│   │       └── LoginForm.tsx       # Single role — no RBAC needed
│   │
│   ├── patients/
│   │   ├── hooks/
│   │   │   ├── usePatientSearch.ts       # Debounced Firestore query
│   │   │   └── usePatientMutation.ts
│   │   ├── components/
│   │   │   ├── PatientSearchInput.tsx    # Step 1 search bar
│   │   │   ├── PatientCard.tsx           # Selected patient display
│   │   │   └── QuickRegisterModal.tsx    # In-place registration
│   │   └── types.ts
│   │
│   ├── catalog/                          # Test Catalog Management
│   │   ├── pages/
│   │   │   └── CatalogManagementPage.tsx  # CRUD list + edit
│   │   ├── components/
│   │   │   ├── CatalogTable.tsx           # Sortable/filterable table
│   │   │   ├── CatalogFormModal.tsx       # Add/edit test definition
│   │   │   ├── RefRangeEditor.tsx         # Inline edit ref ranges
│   │   │   └── ProfileTemplateEditor.tsx  # Edit sections/fields for complex tests
│   │   ├── hooks/
│   │   │   └── useCatalogMutation.ts
│   │   └── types.ts
│   │
│   ├── orders/                           # ★ Core feature
│   │   ├── pages/
│   │   │   ├── OrderWorkflowPage.tsx     # Unified 3-step screen
│   │   │   └── OrderHistoryPage.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── workflow/
│   │   │   │   ├── StepIndicator.tsx     # Step 1-2-3 progress bar
│   │   │   │   ├── Step1_Patient.tsx
│   │   │   │   ├── Step2_TestSelection.tsx
│   │   │   │   └── Step3_DataEntry.tsx
│   │   │   │
│   │   │   ├── test-selection/           # Step 2 sub-components
│   │   │   │   ├── QuickActionButtons.tsx
│   │   │   │   ├── TestCombobox.tsx      # Autocomplete for simple tests
│   │   │   │   └── SelectedTestsList.tsx
│   │   │   │
│   │   │   ├── entry-forms/             # ★ Step 3 — Factory pattern
│   │   │   │   ├── EntryFormFactory.tsx  # Switch/map → correct form
│   │   │   │   ├── SimpleTestForm.tsx
│   │   │   │   ├── HematologyForm.tsx
│   │   │   │   ├── UrinalysisForm.tsx
│   │   │   │   ├── StoolForm.tsx
│   │   │   │   ├── CultureForm.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── SectionHeader.tsx
│   │   │   │       ├── ResultRow.tsx
│   │   │   │       └── DropdownField.tsx
│   │   │   │
│   │   │   └── OrderSummary.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useOrderWorkflow.ts       # State machine for steps
│   │   │   ├── useTestCatalog.ts
│   │   │   └── useOrderMutation.ts
│   │   │
│   │   └── types.ts                      # TestEntry union, OrderDoc
│   │
│   └── reports/                          # PDF generation
│       ├── components/
│       │   ├── ReportDocument.tsx         # @react-pdf/renderer root
│       │   ├── ReportHeader.tsx           # Letterhead (logo, lab info)
│       │   ├── PatientInfoBlock.tsx
│       │   ├── result-sections/          # ★ Factory for PDF sections
│       │   │   ├── PdfSectionFactory.tsx
│       │   │   ├── SimplePdfSection.tsx
│       │   │   ├── HematologyPdfSection.tsx
│       │   │   ├── UrinalysisPdfSection.tsx
│       │   │   ├── StoolPdfSection.tsx
│       │   │   └── CulturePdfSection.tsx
│       │   ├── ReportFooter.tsx          # Signatures, disclaimer
│       │   └── PageWrapper.tsx           # Repeated header on overflow
│       │
│       ├── hooks/
│       │   └── useGenerateReport.ts      # Blob creation + upload
│       │
│       └── styles/
│           └── pdfStyles.ts              # StyleSheet.create({…})
│
├── shared/
│   ├── components/
│   │   ├── ui/                           # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Combobox.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Spinner.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── TopBar.tsx
│   │       └── MainLayout.tsx
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useFirestoreQuery.ts
│   │
│   ├── lib/
│   │   ├── firebase.ts                   # Firebase init + exports
│   │   ├── firestore.ts                  # Typed helpers
│   │   └── constants.ts
│   │
│   └── types/
│       └── index.ts                      # Shared TS types
│
└── assets/
    ├── logo-placeholder.png              # Placeholder until real logo is uploaded
    └── fonts/                            # Custom PDF fonts if needed
```

---

### 2.2 Factory / Switch Pattern — Entry Forms (Step 3)

```tsx
// src/features/orders/components/entry-forms/EntryFormFactory.tsx

import { TestCatalogItem, TestEntry } from "../../types";
import SimpleTestForm from "./SimpleTestForm";
import HematologyForm from "./HematologyForm";
import UrinalysisForm from "./UrinalysisForm";
import StoolForm from "./StoolForm";
import CultureForm from "./CultureForm";

interface EntryFormFactoryProps {
  catalog: TestCatalogItem;
  value: TestEntry;
  onChange: (updated: TestEntry) => void;
}

const FORM_REGISTRY: Record<string, React.FC<any>> = {
  simple:     SimpleTestForm,
  hematology: HematologyForm,
  urinalysis: UrinalysisForm,
  stool:      StoolForm,
  culture:    CultureForm,
};

export const EntryFormFactory: React.FC<EntryFormFactoryProps> = ({
  catalog,
  value,
  onChange,
}) => {
  const FormComponent = FORM_REGISTRY[catalog.format];

  if (!FormComponent) {
    return <div className="text-red-500">Unknown format: {catalog.format}</div>;
  }

  return (
    <FormComponent
      catalog={catalog}
      value={value}
      onChange={onChange}
    />
  );
};
```

> [!TIP]
> The same Registry-Map pattern is mirrored in `PdfSectionFactory.tsx` for PDF rendering. Adding a new test format only requires: (1) add a catalog template, (2) create `XyzForm.tsx`, (3) create `XyzPdfSection.tsx`, (4) register in both maps.

---

### 2.3 Order Workflow State Machine

```tsx
// src/features/orders/hooks/useOrderWorkflow.ts

type Step = 1 | 2 | 3;

interface WorkflowState {
  step: Step;
  patient: Patient | null;
  selectedTests: SelectedTest[];   // { catalogId, catalogItem, entryData }
  orderStatus: "idle" | "saving" | "saved" | "error";
}

// Transitions:
// Step 1 → Step 2:  patient !== null
// Step 2 → Step 3:  selectedTests.length > 0
// Step 3 → Save:    all entries validated
// At any point:     can go back without losing state
```

> [!IMPORTANT]
> The workflow hook must preserve state when the QuickRegisterModal opens in Step 1. Use a `useRef` or state that lives **above** the modal layer so it is never unmounted.

---

## 3. PDF Paging Strategy

### 3.1 Problem

`@react-pdf/renderer` handles automatic page breaks, but **patient header / letterhead must repeat** on every page and section breaks must not orphan a single row.

### 3.2 Solution: `<PageWrapper>` + Fixed Header Pattern

```tsx
// src/features/reports/components/PageWrapper.tsx

import { Page, View } from "@react-pdf/renderer";
import { ReportHeader } from "./ReportHeader";
import { PatientInfoBlock } from "./PatientInfoBlock";
import { ReportFooter } from "./ReportFooter";
import { pdfStyles as s } from "../styles/pdfStyles";

interface PageWrapperProps {
  patient: PatientSnapshot;
  labInfo: LabInfo;
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  patient, labInfo, children
}) => (
  <Page size="LETTER" style={s.page}>
    {/* ── Fixed Header (repeats every page) ───────────── */}
    <View fixed style={s.headerFixed}>
      <ReportHeader labInfo={labInfo} />
      <PatientInfoBlock patient={patient} />
    </View>

    {/* ── Scrollable Body ─────────────────────────────── */}
    <View style={s.body}>
      {children}
    </View>

    {/* ── Fixed Footer (repeats every page) ───────────── */}
    <View fixed style={s.footerFixed}>
      <ReportFooter />
    </View>
  </Page>
);
```

### 3.3 Key Techniques

| Technique | Implementation |
|---|---|
| **Repeating headers** | `<View fixed>` on header and footer — `@react-pdf/renderer` natively repeats `fixed` views on every page |
| **Section break control** | `break-inside: "avoid"` via `style={{ breakInside: "avoid" }}` on each test-result section wrapper |
| **Orphan prevention** | Wrap each table + its section title in a single `<View wrap={false}>` if it must not split. For large tables (hematology), allow splitting but keep the sub-section header with at least 2 rows using `minPresenceAhead` |
| **Page numbers** | `<Text render={({ pageNumber, totalPages }) => \`${pageNumber}/${totalPages}\`} fixed />` in footer |
| **Dynamic body margin** | `paddingTop` on `s.body` equals the fixed header height; `paddingBottom` equals footer height. This prevents content from overlapping fixed elements |

### 3.4 PDF Generation Flow

```
User clicks "Generate Report"
  → useGenerateReport hook
    → <ReportDocument /> renders via @react-pdf/renderer's pdf() API
    → blob() produces PDF Blob
    → Upload to Firebase Storage /reports/{orderId}.pdf
    → Update order doc with pdfUrl
    → Trigger download or open in new tab
```

---

## 4. MVP Roadmap

### Phase 0 — Project Bootstrap (Days 1–2)

- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS v3
- [ ] Set up Firebase project (Firestore, Auth, Storage)
- [ ] Configure Firebase SDK, environment variables, security rules (dev)
- [ ] Set up ESLint, Prettier, path aliases (`@/`)
- [ ] Create `MainLayout` shell (Sidebar + TopBar + content area)
- [ ] Create `config/lab` Firestore document with placeholder lab info
- [ ] Implement `AuthProvider` + Login page (email/password, single role — no RBAC)
- [ ] Deploy initial skeleton to Firebase Hosting

---

### Phase 1 — Patient Module (Days 3–5)

- [ ] Create `patients` Firestore collection + seed sample data
- [ ] Build `PatientSearchInput` with debounced query on `nationalId`
- [ ] Build `PatientCard` display component
- [ ] Build `QuickRegisterModal` (name, DOB, sex, nationalId)
- [ ] Hook: `usePatientSearch` — Firestore `where("nationalId", "==", …)`
- [ ] Hook: `usePatientMutation` — create new patient doc
- [ ] Ensure modal does NOT reset workflow state on open/close

---

### Phase 2 — Test Catalog & Selection Engine (Days 6–10)

- [ ] Design and seed `test_catalog` collection with all formats
  - [ ] 5+ simple tests (Glucose, Urea, Creatinine, Cholesterol, Triglycerides)
  - [ ] Hematology profile template
  - [ ] Urinalysis profile template
  - [ ] Stool profile template
  - [ ] Culture profile template
- [ ] Build `QuickActionButtons` grid (Hematology, Urinalysis, Stool, Culture)
- [ ] Build `TestCombobox` — autocomplete searching `test_catalog` by name/code
- [ ] Build `SelectedTestsList` — removable chips/list of chosen tests
- [ ] Hook: `useTestCatalog` — load + cache catalog items
- [ ] Integrate into `Step2_TestSelection.tsx`
- [ ] **Catalog Management Screen**:
  - [ ] `CatalogTable` — list all tests with search/filter
  - [ ] `CatalogFormModal` — add/edit test name, code, format, category
  - [ ] `RefRangeEditor` — inline editing of units, method, and ref ranges per demographic
  - [ ] `ProfileTemplateEditor` — add/edit/reorder sections and fields for complex profiles
  - [ ] CRUD hooks for catalog mutations

---

### Phase 3 — Dynamic Entry Forms Engine ★ (Days 11–18)

> [!IMPORTANT]
> This is the highest-complexity phase. Each form type requires its own UI, validation, and data mapping.

- [ ] Implement `EntryFormFactory` switch/registry
- [ ] **SimpleTestForm**: single-row input (result, unit auto-filled, flag calculation)
- [ ] **HematologyForm**: multi-section grouped table
  - [ ] Auto-populate fields from `profileTemplate`
  - [ ] Reference range display + flag coloring (H/L)
  - [ ] Peripheral smear notes textarea
- [ ] **UrinalysisForm**: 3-tab or 3-section layout (Physical / Chemical / Microscopic)
  - [ ] Predefined dropdowns (Negative, Positive, 0-2 hpf, 3-5 hpf, etc.)
- [ ] **StoolForm**: Macroscopic / Microscopic / Chemical sections
  - [ ] Predefined dropdowns for common findings
- [ ] **CultureForm**:
  - [ ] Sample type selector
  - [ ] Growth result (Positive/Negative toggle)
  - [ ] Organism name input (conditional)
  - [ ] Antibiogram table builder (add/remove antibiotics, S/I/R radio buttons)
- [ ] Integrate `Step3_DataEntry.tsx` — iterate `selectedTests[]`, render factory
- [ ] Hook: `useOrderWorkflow` — full step machine with state persistence
- [ ] Hook: `useOrderMutation` — save/update order to Firestore

---

### Phase 4 — PDF Report Generation (Days 19–24)

- [ ] Install and configure `@react-pdf/renderer`
- [ ] Register custom fonts (if needed for professional look)
- [ ] Build `ReportHeader` — lab logo, name, address, phone, license #
- [ ] Build `PatientInfoBlock` — name, DOB, sex, doctor, order date
- [ ] Build `PageWrapper` with fixed header/footer
- [ ] Build `ReportFooter` — page numbers, signatures line, disclaimer
- [ ] Implement `PdfSectionFactory` registry (mirrors entry form factory)
- [ ] **SimplePdfSection**: aligned table row
- [ ] **HematologyPdfSection**: grouped table with reference ranges + flags
- [ ] **UrinalysisPdfSection**: 3-section formatted block
- [ ] **StoolPdfSection**: 3-section formatted block
- [ ] **CulturePdfSection**: growth result + antibiogram table
- [ ] Build `ReportDocument` root — assembles all sections
- [ ] Hook: `useGenerateReport` — blob creation, Storage upload, URL save
- [ ] "Generate Report" button on `Step3` / `OrderSummary`
- [ ] Test multi-page breaks, header repetition, orphan prevention

---

### Phase 5 — Polish & Production Readiness

This phase finalizes the application, adding essential pages, robust error handling, and security.

#### 1. Order History Page (`OrderHistoryPage.tsx`)
- **Routing**: Add `/orders/history` to the sidebar navigation.
- **Data Hook**: `useOrderHistory` to query `orders_results` ordered by `orderDate` descending.
- **UI**: A data table displaying patient name, date, tests ordered, and status (`draft`, `reported`).
- **Action**: A button to re-download/view the generated PDF using the stored `pdfUrl`, or regenerate it if missing.

#### 2. Lab Config Settings Page (`LabSettingsPage.tsx`)
- **Routing**: Add `/settings` to the sidebar navigation.
- **Data Hook**: `useLabConfig` to fetch and update the `config/lab` document.
- **UI**: Form for Lab Name, Address, Phone, and License Number.
- **Image Uploads**: Logic to upload a Logo and Letterhead to Firebase Storage. 

> [!WARNING]
> **CORS Reminder**: The image upload functionality to Firebase Storage will fail locally if the CORS issue from the previous step is not resolved using the owner account.

#### 3. UI Polish, Toasts & Validation
- **Toast Notifications**: Propose installing `react-hot-toast` to replace silent `console.error` logs with beautiful, floating success/error messages across the app.
- **Form Validation**: Add `zod` validation schemas to the Patient and Catalog forms.
- **Performance**: Implement `React.lazy` and `Suspense` in `src/app/routes.tsx` to split the JavaScript bundle, addressing the Vite chunk size warning (>500kb).

#### 4. Security Rules
- Create `firestore.rules` and `storage.rules` files configured to only allow reads/writes if `request.auth != null` (since this is a single-role app).

## Resolved Decisions for Phase 5

> [!NOTE]
> 1. **Toasts**: `react-hot-toast` will be installed for UI notifications.
> 2. **Logo/Letterhead**: Image uploads will be handled manually by the user, so no strict aspect ratio constraints or complex upload UI are required.
> 3. **Pagination**: The Order History page will fetch and display a simple limit of the 50 most recent orders.

---

### Phase 6 — Advanced Features & Optimization

This phase focuses on improving reliability, adding professional signature capabilities, enabling historical modifications, and optimizing the generated PDF output.

#### 1. Offline Mode (Firestore Persistence)
- **Goal**: Allow the application to remain functional for reading and caching data even when internet connectivity drops.
- **Implementation**: Enable native Firestore offline persistence in `src/shared/lib/firebase.ts` using `enableIndexedDbPersistence` (or `initializeFirestore` with `localCache`). This ensures the `test_catalog`, `patients`, and `config/lab` are cached locally.

#### 2. Digital Signature Feature
- **Settings Addition**: Add a `signatureUrl` field to the `config/lab` Firestore document. Update the `LabSettingsPage.tsx` to include an input for this URL (or a direct upload if the user chooses to implement Firebase Storage uploads later).
- **Confirmation Modal**: Before calling `generatePdf()` in Step 3 (or from the Order History), intercept the action with a modal asking: *"¿Incluir firma digital en el reporte?"* (Yes/No).
- **PDF Footer Integration**: Modify `ReportFooter.tsx` (in `@react-pdf/renderer`) to conditionally render the `signatureUrl` image above the signature line if the user selected "Yes".

#### 3. Order History Actions (Edit & Delete)
- **Delete Functionality**: 
  - Add a "Delete" button (trash icon) to each row in `OrderHistoryPage.tsx`.
  - Clicking it triggers a secure confirmation dialog: *"¿Está seguro que desea eliminar este reporte? Esta acción no se puede deshacer."*
  - On confirm, delete the document from the `orders_results` collection and remove it from the local state.
- **Edit Functionality**:
  - Add an "Edit" button (pencil icon) to each row.
  - Clicking it routes the user back to `/orders/new` (or a new `/orders/edit/:id` route), pre-loading the `useOrderWorkflow` state with the patient, selected tests, and existing results.
  - The user can modify data and click "Generate Report", which will execute a `setDoc` (update) instead of `addDoc`, overwrite the existing PDF, and save the updated data.

#### 4. Optimize Simple Tests PDF Layout
- **Goal**: Reduce vertical space and improve readability by grouping all tests of format `"simple"` into a single unified table.
- **Implementation**:
  - Currently, `SimplePdfSection.tsx` might be rendering a separate header for every single test.
  - Modify `ReportDocument.tsx` or `PdfSectionFactory.tsx` to pre-process the `order.tests` array.
  - Group all `format === "simple"` tests into a single array.
  - Render a new component `GroupedSimplePdfSection.tsx` that outputs one unified table header: `[Prueba] | [Resultado] | [Valor de Referencia] | [Método]`, followed by rows for each simple test.

## Open Questions for Phase 6

> [!IMPORTANT]
> 1. **Signature Upload**: For the signature, do you prefer a simple text input where you paste the Firebase Storage URL (like we did for the logo/letterhead), or do you want me to build an actual file-picker that uploads the PNG directly to Firebase Storage?
> 2. **Edit Routing**: When editing a past order, is it acceptable to reuse the `OrderWorkflowPage` (Step 1-2-3) and just pre-fill the data, or would you prefer a dedicated "Quick Edit" modal that only allows changing the results (Step 3)?

---

## 5. Design Decisions (Resolved)

| Question | Decision |
|---|---|
| **Multi-tenancy** | Single lab. Lab info stored in `/config/lab` document. No multi-tenant routing. |
| **User roles** | Single role with full permissions. No RBAC. Simple `isAuthenticated` guard on all routes. |
| **Logo / letterhead** | User has assets and will upload later. Placeholder used until then. Lab config settings page in Phase 5. |
| **Ref ranges & units** | Fully editable through Test Catalog Management screen. Changes apply to future orders only (past orders retain snapshot). |

---

## 6. Verification Plan

### Automated Tests
```bash
# Unit tests for factory pattern and data transformations
npm run test

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

### Manual Verification
- Walk through full workflow: search patient → select tests → enter data → generate PDF
- Verify PDF renders correctly with letterhead on multi-page reports
- Test QuickRegisterModal state preservation
- Verify Firestore security rules with different auth roles
- Cross-browser PDF download (Chrome, Firefox, Edge)
- Test all 5 format types end-to-end (simple, hematology, urinalysis, stool, culture)
