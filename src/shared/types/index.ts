import { Timestamp } from "firebase/firestore"

// ─────────────────────────────────────────────
// Lab Config
// ─────────────────────────────────────────────
export interface LabConfig {
  labName: string
  address: string
  phone: string
  MPPS?: string
  CBC?: string
  emailAdress?: string
  logoUrl?: string
  letterheadUrl?: string
  footerText?: string
  signatureUrl?: string
  rif?: string
  bioanalista?: string
}

// ─────────────────────────────────────────────
// Patient
// ─────────────────────────────────────────────
export interface Patient {
  id: string
  nationalId: string
  firstName: string
  lastName: string
  dateOfBirth?: Timestamp
  age?: number
  sex: "M" | "F"
  phone?: string
  email?: string
  address?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PatientSnapshot {
  patientId: string
  nationalId: string
  firstName: string
  lastName: string
  dateOfBirth?: Timestamp
  age?: number
  sex: "M" | "F"
}

// ─────────────────────────────────────────────
// Test Catalog
// ─────────────────────────────────────────────
export type TestFormat = "simple" | "custom" | "hematology" | "urinalysis" | "stool" | "culture"

export interface RefRange {
  male: { min: number; max: number }
  female: { min: number; max: number }
  child?: { min: number; max: number }
}

export interface ReferenceValue {
  type: "single_point" | "two_point" | "group"
  min?: number
  max?: number
  groups?: {
    name: string
    type: "single_point" | "two_point"
    min?: number
    max: number
  }[]
}

export interface SimpleTestDefaults {
  unit: string
  method: string
  refRanges?: RefRange
  refValue?: ReferenceValue
}

export interface ProfileField {
  key: string
  label: string
  inputType: "number" | "text" | "select" | "textarea"
  options?: string[]
  unit?: string
  refRanges?: RefRange
  refValue?: ReferenceValue
  defaultValue?: string | number
}

export interface ProfileSection {
  sectionName: string
  fields: ProfileField[]
}

export interface ProfileTemplate {
  sections: ProfileSection[]
}

// ─────────────────────────────────────────────
// Custom Format Builder
// ─────────────────────────────────────────────
export interface FormatColumn {
  id: string
  label: string                            // "Color", "Moco", etc.
  type: "text" | "number" | "select" | "reference" | "unit"
  options?: string[]                          // Solo para type "select"
  width?: number                            // Ancho relativo (1–12)
  defaultValue?: string                        // Valor por defecto / fijo
  isFixed?: boolean                           // Si es un valor fijo (no editable)
  isHeaderOnly?: boolean                       // Si es solo cabecera/membrete (sin valor)
  refType?: "single_point" | "two_point" | "group" // Tipo interno del rango
  min?: number
  max?: number
  groups?: {                               // Arreglo para grupos en columnas custom
    name: string
    type: "single_point" | "two_point"
    min?: number
    max: number
  }[]
}

export interface EmptyRow {
  id: string
  type: "empty"
}

export interface HeaderRow {
  id: string
  type: "header"
  text: string                                 // "Análisis Macroscópico:"
}

export interface TestRow {
  id: string
  type: "test"
  columns: FormatColumn[]
}

export interface SimpleRow {
  id: string
  type: "simple"
  columns: FormatColumn[]
}

export type FormatRow = EmptyRow | HeaderRow | TestRow | SimpleRow

export interface CustomFormatTemplate {
  rows: FormatRow[]
}

export interface TestCatalogItem {
  id: string
  name: string
  code: string
  format: TestFormat
  category: string
  isQuickAction: boolean
  simpleDefaults?: SimpleTestDefaults
  profileTemplate?: ProfileTemplate
  customTemplate?: CustomFormatTemplate       // Solo cuando format === "custom"
  active: boolean
  order: number
}

// ─────────────────────────────────────────────
// Order / Results — Polymorphic TestEntry union
// ─────────────────────────────────────────────
export type ResultFlag = "H" | "L" | "N"
export type EntryStatus = "pending" | "entered" | "validated"
export type OrderStatus = "draft" | "in_progress" | "completed" | "reported"

interface TestEntryBase {
  catalogId: string
  testName: string
  format: TestFormat
  status: EntryStatus
}

export interface SimpleTestEntry extends TestEntryBase {
  format: "simple"
  data: {
    result: string | number
    unit: string
    refValue: ReferenceValue | string
    method: string
    flag?: ResultFlag
  }
}

export interface HematologyResultRow {
  key: string
  label: string
  value: string | number
  unit: string
  refRange: string
  flag?: ResultFlag
}

export interface HematologySection {
  sectionName: string
  results: HematologyResultRow[]
}

export interface HematologyEntry extends TestEntryBase {
  format: "hematology"
  data: {
    sections: HematologySection[]
    smearNotes?: string
  }
}

export interface UrinalysisEntry extends TestEntryBase {
  format: "urinalysis"
  data: {
    physical: Record<string, string>
    chemical: Record<string, string>
    microscopic: Record<string, string>
  }
}

export interface StoolEntry extends TestEntryBase {
  format: "stool"
  data: {
    macroscopic: Record<string, string>
    microscopic: Record<string, string>
    chemical: Record<string, string>
  }
}

export interface AntibiogramRow {
  antibiotic: string
  result: "S" | "I" | "R"
  mic?: string
}

export interface CultureEntry extends TestEntryBase {
  format: "culture"
  data: {
    sampleType: string
    gramStain?: string
    cultureResult: string
    organism?: string
    colonyCount?: string
    antibiogram?: AntibiogramRow[]
    notes?: string
  }
}

export interface CustomTestEntry extends TestEntryBase {
  format: "custom"
  customTemplate: CustomFormatTemplate
  data: {
    // key: "<rowId>_<colId>" = valor ingresado por el usuario
    [fieldKey: string]: string
  }
}

export type TestEntry =
  | SimpleTestEntry
  | HematologyEntry
  | UrinalysisEntry
  | StoolEntry
  | CultureEntry
  | CustomTestEntry

export interface OrderResult {
  id: string
  patientId: string
  patientSnapshot: PatientSnapshot
  orderDate: Timestamp
  status: OrderStatus
  referringDoctor?: string
  tests: TestEntry[]
  pdfUrl?: string
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
