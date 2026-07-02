export const COLLECTIONS = {
  PATIENTS: "patients",
  TEST_CATALOG: "test_catalog",
  ORDERS: "orders_results",
  CONFIG: "config",
} as const

export const CONFIG_DOC_ID = "lab"

export const APP_NAME = "LabSys"

export const ORDER_STATUSES = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REPORTED: "reported",
} as const

export const TEST_FORMATS = {
  SIMPLE: "simple",
  CULTURE: "culture",
} as const

export const URINALYSIS_DROPDOWNS = {
  color: ["Amarillo pálido", "Amarillo", "Amarillo oscuro", "Ámbar", "Naranja", "Rojo", "Pardo", "Incoloro"],
  appearance: ["Transparente", "Ligeramente turbio", "Turbio", "Lechoso"],
  reaction: ["Ácido", "Ligeramente ácido", "Neutro", "Ligeramente alcalino", "Alcalino"],
  generic: ["Negativo", "Positivo", "Trazas", "1+", "2+", "3+", "4+"],
  micro_count: ["Ninguno", "Escasos", "0-2 hpf", "2-5 hpf", "5-10 hpf", "10-20 hpf", ">20 hpf", "Numerosos"],
} as const

export const STOOL_DROPDOWNS = {
  color: ["Marrón", "Amarillo", "Verde", "Negro", "Rojo", "Gris", "Blanco"],
  consistency: ["Sólida", "Semi-sólida", "Blanda", "Líquida", "Pastosa"],
  generic: ["Negativo", "Positivo", "Escaso", "Moderado", "Abundante"],
  micro_count: ["Ninguno", "Escasos", "0-2 hpf", "2-5 hpf", "5-10 hpf", ">10 hpf"],
} as const
