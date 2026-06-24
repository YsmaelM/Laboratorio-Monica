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

  // ─────────────────────────────────────────────
  // Profiles
  // ─────────────────────────────────────────────
  {
    name: "Hematología Completa",
    code: "HEM-COMP",
    format: "hematology",
    category: "Hematología",
    isQuickAction: true,
    order: 1,
    active: true,
    profileTemplate: {
      sections: [
        {
          sectionName: "Eritrograma",
          fields: [
            { key: "rbc", label: "Hematíes", inputType: "number", unit: "x10^6/µL", refRanges: { male: { min: 4.5, max: 5.9 }, female: { min: 4.0, max: 5.2 } } },
            { key: "hb", label: "Hemoglobina", inputType: "number", unit: "g/dL", refRanges: { male: { min: 13.5, max: 17.5 }, female: { min: 12.0, max: 15.5 } } },
            { key: "hct", label: "Hematocrito", inputType: "number", unit: "%", refRanges: { male: { min: 41, max: 53 }, female: { min: 36, max: 46 } } },
            { key: "mcv", label: "VCM", inputType: "number", unit: "fL", refRanges: { male: { min: 80, max: 100 }, female: { min: 80, max: 100 } } },
            { key: "mch", label: "HCM", inputType: "number", unit: "pg", refRanges: { male: { min: 27, max: 34 }, female: { min: 27, max: 34 } } },
            { key: "mchc", label: "CHCM", inputType: "number", unit: "g/dL", refRanges: { male: { min: 32, max: 36 }, female: { min: 32, max: 36 } } },
          ],
        },
        {
          sectionName: "Leucograma",
          fields: [
            { key: "wbc", label: "Leucocitos", inputType: "number", unit: "x10^3/µL", refRanges: { male: { min: 4.5, max: 11 }, female: { min: 4.5, max: 11 } } },
            { key: "neutrophils_percent", label: "Neutrófilos %", inputType: "number", unit: "%", refRanges: { male: { min: 40, max: 70 }, female: { min: 40, max: 70 } } },
            { key: "lymphocytes_percent", label: "Linfocitos %", inputType: "number", unit: "%", refRanges: { male: { min: 20, max: 40 }, female: { min: 20, max: 40 } } },
            { key: "monocytes_percent", label: "Monocitos %", inputType: "number", unit: "%", refRanges: { male: { min: 2, max: 8 }, female: { min: 2, max: 8 } } },
            { key: "eosinophils_percent", label: "Eosinófilos %", inputType: "number", unit: "%", refRanges: { male: { min: 1, max: 4 }, female: { min: 1, max: 4 } } },
            { key: "basophils_percent", label: "Basófilos %", inputType: "number", unit: "%", refRanges: { male: { min: 0, max: 1 }, female: { min: 0, max: 1 } } },
          ],
        },
        {
          sectionName: "Plaquetas",
          fields: [
            { key: "plt", label: "Plaquetas", inputType: "number", unit: "x10^3/µL", refRanges: { male: { min: 150, max: 450 }, female: { min: 150, max: 450 } } },
          ],
        },
      ],
    },
  },
  {
    name: "Examen de Orina",
    code: "URI-01",
    format: "urinalysis",
    category: "Uroanálisis",
    isQuickAction: true,
    order: 1,
    active: true,
    profileTemplate: {
      sections: [
        {
          sectionName: "Físico",
          fields: [
            { key: "color", label: "Color", inputType: "select", options: ["Amarillo", "Ámbar", "Rojo", "Marrón", "Transparente"], defaultValue: "Amarillo" },
            { key: "aspect", label: "Aspecto", inputType: "select", options: ["Límpido", "Ligeramente Turbio", "Turbio", "Muy Turbio"], defaultValue: "Límpido" },
            { key: "density", label: "Densidad", inputType: "number", defaultValue: 1.020, refRanges: { male: { min: 1.005, max: 1.030 }, female: { min: 1.005, max: 1.030 } } },
          ],
        },
        {
          sectionName: "Químico",
          fields: [
            { key: "ph", label: "pH", inputType: "number", defaultValue: 6.0, refRanges: { male: { min: 5.0, max: 8.0 }, female: { min: 5.0, max: 8.0 } } },
            { key: "protein", label: "Proteínas", inputType: "select", options: ["Negativo", "Indicios", "+", "++", "+++"], defaultValue: "Negativo" },
            { key: "glucose", label: "Glucosa", inputType: "select", options: ["Negativo", "Indicios", "+", "++", "+++"], defaultValue: "Negativo" },
            { key: "ketones", label: "Cetonas", inputType: "select", options: ["Negativo", "Indicios", "+", "++", "+++"], defaultValue: "Negativo" },
            { key: "blood", label: "Sangre Oculta", inputType: "select", options: ["Negativo", "Indicios", "+", "++", "+++"], defaultValue: "Negativo" },
            { key: "bilirubin", label: "Bilirrubina", inputType: "select", options: ["Negativo", "Indicios", "+", "++", "+++"], defaultValue: "Negativo" },
            { key: "urobilinogen", label: "Urobilinógeno", inputType: "select", options: ["Normal", "Aumentado"], defaultValue: "Normal" },
            { key: "nitrite", label: "Nitritos", inputType: "select", options: ["Negativo", "Positivo"], defaultValue: "Negativo" },
            { key: "leukocyte_esterase", label: "Esterasa Leucocitaria", inputType: "select", options: ["Negativo", "Indicios", "+", "++", "+++"], defaultValue: "Negativo" },
          ],
        },
        {
          sectionName: "Microscópico",
          fields: [
            { key: "leukocytes_micro", label: "Leucocitos", inputType: "text", defaultValue: "0 - 2 por campo" },
            { key: "erythrocytes_micro", label: "Eritrocitos", inputType: "text", defaultValue: "0 - 2 por campo" },
            { key: "epithelial_cells", label: "Células Epiteliales", inputType: "select", options: ["Escasas", "Moderadas", "Abundantes"], defaultValue: "Escasas" },
            { key: "bacteria", label: "Bacterias", inputType: "select", options: ["Escasas", "Moderadas", "Abundantes"], defaultValue: "Escasas" },
            { key: "crystals", label: "Cristales", inputType: "text", defaultValue: "No se observan" },
            { key: "casts", label: "Cilindros", inputType: "text", defaultValue: "No se observan" },
          ]
        }
      ],
    },
  },
  {
    name: "Coprológico",
    code: "COP-01",
    format: "stool",
    category: "Coprología",
    isQuickAction: true,
    order: 1,
    active: true,
    profileTemplate: {
      sections: [
        {
          sectionName: "Macroscópico",
          fields: [
            { key: "color", label: "Color", inputType: "select", options: ["Marrón", "Verde", "Amarillo", "Negro", "Rojo", "Blanco"], defaultValue: "Marrón" },
            { key: "consistency", label: "Consistencia", inputType: "select", options: ["Sólida", "Pastosa", "Líquida", "Dura", "Semilíquida"], defaultValue: "Pastosa" },
            { key: "mucus", label: "Moco", inputType: "select", options: ["Negativo", "Positivo"], defaultValue: "Negativo" },
            { key: "blood", label: "Sangre Macroscópica", inputType: "select", options: ["Negativo", "Positivo"], defaultValue: "Negativo" },
          ],
        },
        {
          sectionName: "Microscópico",
          fields: [
            { key: "parasites", label: "Parásitos", inputType: "textarea", defaultValue: "No se observan quistes, huevos ni formas vegetativas de parásitos intestinales." },
            { key: "leukocytes", label: "Leucocitos", inputType: "text", defaultValue: "0 - 2 por campo" },
            { key: "erythrocytes", label: "Eritrocitos", inputType: "text", defaultValue: "No se observan" },
            { key: "fat", label: "Grasa / Jabones", inputType: "select", options: ["Negativo", "Positivo"], defaultValue: "Negativo" },
          ],
        },
        {
          sectionName: "Químico",
          fields: [
            { key: "ph", label: "pH", inputType: "number", defaultValue: 7.0 },
            { key: "occult_blood", label: "Sangre Oculta", inputType: "select", options: ["Negativo", "Positivo"], defaultValue: "Negativo" },
          ]
        }
      ],
    },
  },
  {
    name: "Cultivo y Antibiograma",
    code: "CUL-01",
    format: "culture",
    category: "Microbiología",
    isQuickAction: true,
    order: 1,
    active: true,
  }
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
