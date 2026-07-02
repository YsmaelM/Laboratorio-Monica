import { collection, doc, getDocs, writeBatch } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { TestCatalogItem } from "@/shared/types"

const INITIAL_CATALOG: Omit<TestCatalogItem, "id">[] = [
  // ─────────────────────────────────────────────
  // Simple Tests
  // ─────────────────────────────────────────────
  {
    name: "Glucosa en Ayunas",
    code: "GLU-01",
    format: "simple",
    category: "Química",
    isQuickAction: false,
    order: 1,
    active: true,
    simpleDefaults: {
      unit: "mg/dL",
      method: "Enzimático",
      refValue: {
        type: "group",
        groups: [
          { name: "Hombres", type: "two_point", min: 70, max: 100 },
          { name: "Mujeres", type: "two_point", min: 70, max: 100 },
          { name: "Niños", type: "two_point", min: 60, max: 100 },
        ],
      },
    },
  },
  {
    name: "Urea",
    code: "URE-01",
    format: "simple",
    category: "Química",
    isQuickAction: false,
    order: 2,
    active: true,
    simpleDefaults: {
      unit: "mg/dL",
      method: "Ureasa",
      refValue: {
        type: "group",
        groups: [
          { name: "Hombres", type: "two_point", min: 15, max: 45 },
          { name: "Mujeres", type: "two_point", min: 15, max: 40 },
          { name: "Niños", type: "two_point", min: 10, max: 35 },
        ],
      },
    },
  },
  {
    name: "Creatinina",
    code: "CRE-01",
    format: "simple",
    category: "Química",
    isQuickAction: false,
    order: 3,
    active: true,
    simpleDefaults: {
      unit: "mg/dL",
      method: "Picrato Alcalino",
      refValue: {
        type: "group",
        groups: [
          { name: "Hombres", type: "two_point", min: 0.7, max: 1.3 },
          { name: "Mujeres", type: "two_point", min: 0.5, max: 1.1 },
        ],
      },
    },
  },
  {
    name: "Colesterol Total",
    code: "COL-01",
    format: "simple",
    category: "Química",
    isQuickAction: false,
    order: 4,
    active: true,
    simpleDefaults: {
      unit: "mg/dL",
      method: "Enzimático",
      refValue: {
        type: "group",
        groups: [
          { name: "Hombres", type: "two_point", min: 0, max: 200 },
          { name: "Mujeres", type: "two_point", min: 0, max: 200 },
        ],
      },
    },
  },
  {
    name: "Triglicéridos",
    code: "TRI-01",
    format: "simple",
    category: "Química",
    isQuickAction: false,
    order: 5,
    active: true,
    simpleDefaults: {
      unit: "mg/dL",
      method: "Enzimático",
      refValue: {
        type: "group",
        groups: [
          { name: "Hombres", type: "two_point", min: 0, max: 150 },
          { name: "Mujeres", type: "two_point", min: 0, max: 150 },
        ],
      },
    },
  },
]

export const seedCatalog = async () => {
  const catalogRef = collection(db, "test_catalog")
  const snapshot = await getDocs(catalogRef)

  if (!snapshot.empty) {
    console.log("El catálogo ya contiene pruebas. No se requiere seed.")
    return false
  }

  const batch = writeBatch(db)

  INITIAL_CATALOG.forEach((item) => {
    const docRef = doc(catalogRef)
    batch.set(docRef, { ...item, id: docRef.id })
  })

  await batch.commit()
  console.log("Catálogo inicializado con éxito.")
  return true
}
