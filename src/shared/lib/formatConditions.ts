import type { CustomFormatTemplate, FormatColumn, FormatRow } from "@/shared/types"

/**
 * Encuentra una columna y su fila correspondiente dentro de la plantilla del formato.
 */
export function findColumnById(
  template: CustomFormatTemplate | undefined,
  colId: string
): { column: FormatColumn; rowId: string } | null {
  if (!template?.rows) return null

  for (const row of template.rows) {
    if (row.type === "test" || row.type === "simple") {
      const found = row.columns.find((c) => c.id === colId)
      if (found) {
        return { column: found, rowId: row.id }
      }
    }
  }
  return null
}

/**
 * Obtiene todas las columnas disponibles en la plantilla con metadata descriptiva,
 * útil para el selector de columnas origen en el constructor.
 */
export function getAllAvailableColumns(
  template: CustomFormatTemplate | undefined
): Array<{ column: FormatColumn; rowId: string; label: string }> {
  if (!template?.rows) return []

  const result: Array<{ column: FormatColumn; rowId: string; label: string }> = []

  template.rows.forEach((row, rowIdx) => {
    if (row.type === "test" || row.type === "simple") {
      row.columns.forEach((col, colIdx) => {
        const colLabel = col.label || `Col #${colIdx + 1}`
        const rowTypeLabel = row.type === "test" ? "Cabecera" : "Simple"
        result.push({
          column: col,
          rowId: row.id,
          label: `${colLabel} (Fila #${rowIdx + 1} - ${rowTypeLabel})`,
        })
      })
    }
  })

  return result
}

/**
 * Obtiene el valor actual de una columna dentro del diccionario de datos,
 * con fallback inteligente a defaultValue o la primera opción de un select.
 */
export function getColumnValue(
  colId: string,
  data: Record<string, any> = {},
  template?: CustomFormatTemplate
): string {
  // 1. Intentar buscar con coincidencia directa por ID
  if (data[colId] !== undefined && data[colId] !== null) {
    return String(data[colId])
  }

  // 2. Si la llave es rowId|colId, buscar en el template la fila exacta
  const found = findColumnById(template, colId)
  if (found) {
    const key = `${found.rowId}|${colId}`
    if (data[key] !== undefined && data[key] !== null) {
      return String(data[key])
    }
  }

  // 3. Buscar cualquier entrada en data que termine con |colId
  const matchingKey = Object.keys(data).find((k) => k.endsWith(`|${colId}`))
  if (matchingKey && data[matchingKey] !== undefined && data[matchingKey] !== null) {
    return String(data[matchingKey])
  }

  // 4. Fallback al valor por defecto o primera opción de la columna
  if (found?.column) {
    const col = found.column
    if (col.defaultValue) return col.defaultValue
    if (col.type === "select" && col.options && col.options.length > 0) {
      return col.options[0]
    }
  }

  return ""
}

/**
 * Evalúa si una fila debe ser visible de acuerdo a su regla de condición.
 * Si no tiene condición configurada, devuelve true (siempre visible).
 */
export function checkRowVisibility(
  row: FormatRow,
  data: Record<string, any> = {},
  template?: CustomFormatTemplate
): boolean {
  if (!row.condition || !row.condition.dependsOnColId) {
    return true
  }

  const { dependsOnColId, operator, value = "" } = row.condition
  const currentValue = getColumnValue(dependsOnColId, data, template).trim().toLowerCase()
  const expectedValue = (value ?? "").trim().toLowerCase()

  switch (operator) {
    case "equals":
      return currentValue === expectedValue

    case "not_equals":
      return currentValue !== expectedValue

    case "is_not_empty":
      return currentValue.length > 0

    case "is_empty":
      return currentValue.length === 0

    default:
      return true
  }
}
