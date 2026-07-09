import type { TestCatalogItem, TestEntry } from "@/shared/types"

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
          refValue: catalogItem.simpleDefaults?.refValue || "", // Calculated at entry time based on patient sex/age, but could be empty initially
        },
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
              initialData[`${row.id}|${col.id}`] = col.defaultValue
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
