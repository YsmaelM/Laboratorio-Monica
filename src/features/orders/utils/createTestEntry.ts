import type { TestCatalogItem, TestEntry, HematologySection, HematologyResultRow } from "@/shared/types"

export function createTestEntry(catalogItem: TestCatalogItem): TestEntry {
  const base = {
    catalogId: catalogItem.id,
    testName: catalogItem.name,
    status: "pending" as const,
  }

  switch (catalogItem.format) {
    case "simple":
      return {
        ...base,
        format: "simple",
        data: {
          result: "",
          unit: catalogItem.simpleDefaults?.unit || "",
          method: catalogItem.simpleDefaults?.method || "",
          refRange: "", // Calculated at entry time based on patient sex/age, but could be empty initially
        },
      }

    case "hematology":
      const hemSections: HematologySection[] = (catalogItem.profileTemplate?.sections || []).map(section => ({
        sectionName: section.sectionName,
        results: section.fields.map(field => ({
          key: field.key,
          label: field.label,
          value: field.defaultValue ?? "",
          unit: field.unit || "",
          refRange: "", // Empty until patient sex is evaluated
        } as HematologyResultRow)),
      }))

      return {
        ...base,
        format: "hematology",
        data: { sections: hemSections },
      }

    case "urinalysis":
      const uriSections = catalogItem.profileTemplate?.sections || []
      const physical: Record<string, string> = {}
      const chemical: Record<string, string> = {}
      const microscopic: Record<string, string> = {}

      uriSections.find(s => s.sectionName === "Físico")?.fields.forEach(f => { physical[f.key] = String(f.defaultValue ?? "") })
      uriSections.find(s => s.sectionName === "Químico")?.fields.forEach(f => { chemical[f.key] = String(f.defaultValue ?? "") })
      uriSections.find(s => s.sectionName === "Microscópico")?.fields.forEach(f => { microscopic[f.key] = String(f.defaultValue ?? "") })

      return {
        ...base,
        format: "urinalysis",
        data: { physical, chemical, microscopic },
      }

    case "stool":
      const stoolSections = catalogItem.profileTemplate?.sections || []
      const macroscopic: Record<string, string> = {}
      const microscopicStool: Record<string, string> = {}
      const chemicalStool: Record<string, string> = {}

      stoolSections.find(s => s.sectionName === "Macroscópico")?.fields.forEach(f => { macroscopic[f.key] = String(f.defaultValue ?? "") })
      stoolSections.find(s => s.sectionName === "Microscópico")?.fields.forEach(f => { microscopicStool[f.key] = String(f.defaultValue ?? "") })
      stoolSections.find(s => s.sectionName === "Químico")?.fields.forEach(f => { chemicalStool[f.key] = String(f.defaultValue ?? "") })

      return {
        ...base,
        format: "stool",
        data: { macroscopic, microscopic: microscopicStool, chemical: chemicalStool },
      }

    case "culture":
      return {
        ...base,
        format: "culture",
        data: {
          sampleType: "",
          cultureResult: "Negative",
        },
      }

    case "custom":
      const initialData: Record<string, string> = {}
      const template = catalogItem.customTemplate ?? { rows: [] }
      template.rows.forEach((row) => {
        if (row.type === "test" || row.type === "simple") {
          row.columns.forEach((col) => {
            if (col.defaultValue) {
              initialData[`${row.id}_${col.id}`] = col.defaultValue
            }
          })
        }
      })
      return {
        ...base,
        format: "custom",
        customTemplate: template,
        data: initialData,
      }

    default:
      throw new Error(`Unsupported format: ${catalogItem.format}`)
  }
}
