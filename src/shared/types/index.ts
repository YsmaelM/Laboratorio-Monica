import { Timestamp } from "firebase/firestore"

// ─────────────────────────────────────────────
// Lab Config
// ─────────────────────────────────────────────
export interface LabConfig {
  labName: string
  address: string
  phone: string
  licenseNumber?: string
  logoUrl?: string
  letterheadUrl?: string
  footerText?: string
  signatureUrl?: string
}

// ─────────────────────────────────────────────
// Patient
// ─────────────────────────────────────────────
export interface Patient {
  id: string
  nationalId: string
  firstName: string
  lastName: string
  dateOfBirth: Timestamp
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
  dateOfBirth: Timestamp
  sex: "M" | "F"
}

// ─────────────────────────────────────────────
// Test Catalog
// ─────────────────────────────────────────────
export type TestFormat = "simple" | "hematology" | "urinalysis" | "stool" | "culture"

export interface RefRange {
  male:    { min: number; max: number }
  female:  { min: number; max: number }
  child?:  { min: number; max: number }
}

export interface SimpleTestDefaults {
  unit:      string
  method:    string
  refRanges: RefRange
}

export interface ProfileField {
  key:           string
  label:         string
  inputType:     "number" | "text" | "select" | "textarea"
  options?:      string[]
  unit?:         string
  refRanges?:    RefRange
  defaultValue?: string | number
}

export interface ProfileSection {
  sectionName: string
  fields:      ProfileField[]
}

export interface ProfileTemplate {
  sections: ProfileSection[]
}

export interface TestCatalogItem {
  id:              string
  name:            string
  code:            string
  format:          TestFormat
  category:        string
  isQuickAction:   boolean
  simpleDefaults?: SimpleTestDefaults
  profileTemplate?: ProfileTemplate
  active:          boolean
  order:           number
}

// ─────────────────────────────────────────────
// Order / Results — Polymorphic TestEntry union
// ─────────────────────────────────────────────
export type ResultFlag = "H" | "L" | "N"
export type EntryStatus = "pending" | "entered" | "validated"
export type OrderStatus = "draft" | "in_progress" | "completed" | "reported"

interface TestEntryBase {
  catalogId: string
  testName:  string
  format:    TestFormat
  status:    EntryStatus
}

export interface SimpleTestEntry extends TestEntryBase {
  format: "simple"
  data: {
    result:   string | number
    unit:     string
    refRange: string
    method:   string
    flag?:    ResultFlag
  }
}

export interface HematologyResultRow {
  key:       string
  label:     string
  value:     string | number
  unit:      string
  refRange:  string
  flag?:     ResultFlag
}

export interface HematologySection {
  sectionName: string
  results:     HematologyResultRow[]
}

export interface HematologyEntry extends TestEntryBase {
  format: "hematology"
  data: {
    sections:    HematologySection[]
    smearNotes?: string
  }
}

export interface UrinalysisEntry extends TestEntryBase {
  format: "urinalysis"
  data: {
    physical:    Record<string, string>
    chemical:    Record<string, string>
    microscopic: Record<string, string>
  }
}

export interface StoolEntry extends TestEntryBase {
  format: "stool"
  data: {
    macroscopic: Record<string, string>
    microscopic: Record<string, string>
    chemical:    Record<string, string>
  }
}

export interface AntibiogramRow {
  antibiotic: string
  result:     "S" | "I" | "R"
  mic?:       string
}

export interface CultureEntry extends TestEntryBase {
  format: "culture"
  data: {
    sampleType:     string
    gramStain?:     string
    cultureResult:  string
    organism?:      string
    colonyCount?:   string
    antibiogram?:   AntibiogramRow[]
    notes?:         string
  }
}

export type TestEntry =
  | SimpleTestEntry
  | HematologyEntry
  | UrinalysisEntry
  | StoolEntry
  | CultureEntry

export interface OrderResult {
  id:              string
  patientId:       string
  patientSnapshot: PatientSnapshot
  orderDate:       Timestamp
  status:          OrderStatus
  referringDoctor?: string
  tests:           TestEntry[]
  pdfUrl?:         string
  createdBy:       string
  createdAt:       Timestamp
  updatedAt:       Timestamp
}
