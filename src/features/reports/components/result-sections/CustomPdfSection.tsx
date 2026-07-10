import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { CustomTestEntry, HeaderRow, TestRow, SimpleRow, EmptyRow } from "@/shared/types"

interface CustomPdfSectionProps {
  entry: CustomTestEntry
  patient?: any
  showTitle?: boolean
}

export function CustomPdfSection({ entry, patient, showTitle }: CustomPdfSectionProps) {
  const { data } = entry
  const customTemplate = entry.customTemplate

  if (!customTemplate || customTemplate.rows.length === 0) {
    return <Text style={s.tableCell}>Formato sin filas configuradas.</Text>
  }

  let simpleRowCount = 0

  // ── MOTOR EVALUADOR DE FÓRMULAS ──────────────────────────────────────────────
  const evaluateFormula = (
    formulaExpression: string | undefined,
    rowId: string,
    data: Record<string, string | number>,
    customTemplate?: any
  ): string => {
    if (!formulaExpression) return "—"
    try {
      let expression = formulaExpression
      const tokenRegex = /\{([^}]+)\}/g
      let match
      let missingField = false
      const replacements: Array<{ token: string; value: string }> = []
      while ((match = tokenRegex.exec(formulaExpression)) !== null) {
        const targetColId = match[1]
        let fieldKey = `${rowId}|${targetColId}`
        let rawValue = data[fieldKey]
        if ((rawValue === undefined || rawValue === "") && customTemplate?.rows) {
          for (const row of customTemplate.rows) {
            if (row.columns && Array.isArray(row.columns)) {
              const foundCol = row.columns.find((c: any) => c.id === targetColId)
              if (foundCol) {
                if (foundCol.type === "formula") {
                  rawValue = evaluateFormula(foundCol.formulaExpression, row.id, data, customTemplate)
                } else {
                  fieldKey = `${row.id}|${targetColId}`
                  rawValue = data[fieldKey]
                }
                break
              }
            }
          }
        }
        const numValue = Number(rawValue)
        if (rawValue === undefined || rawValue === "" || isNaN(numValue)) { missingField = true; break }
        replacements.push({ token: match[0], value: numValue.toString() })
      }
      if (missingField) return "—"
      replacements.forEach(({ token, value }) => { expression = expression.split(token).join(value) })
      if (expression.includes("{") || expression.includes("}")) return "—"
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, "")
      if (!sanitizedExpression.trim()) return "—"
      const result = new Function(`return (${sanitizedExpression})`)()
      if (result === null || result === undefined || isNaN(result) || !isFinite(result)) return "0"
      return Number(result) % 1 === 0 ? result.toString() : Number(result).toFixed(2)
    } catch (error) {
      console.error("Formula parsing error:", error)
      return "Error"
    }
  }

  // ── EXTRACCIÓN DE VALORES DE REFERENCIA ──────────────────────────────────────
  const getRefColumnValue = (col: any, refColumn: any) => {
    const activeGroups = refColumn?.groups || col?.groups || col?.referenceValue?.groups
    if (Array.isArray(activeGroups) && activeGroups.length > 0) {
      return activeGroups.map(
        (g: any) => `${g.name}: ${g.type === "two_point" ? `${g.min ?? 0} - ${g.max ?? 0}` : g.type === "desde" ? `Desde ${g.min ?? 0}` : `Hasta ${g.max ?? 0}`}`
      )
    }
    const dValue = col.defaultValue ?? ""
    if (typeof dValue === "string" && (dValue.toLowerCase().includes("desglose") || dValue.toLowerCase().includes("grupo"))) {
      if (refColumn?.min !== undefined && refColumn?.max !== undefined) return `${refColumn.min} - ${refColumn.max}`
      if (refColumn?.min !== undefined) return `Desde ${refColumn.min}`
      if (refColumn?.max !== undefined) return `Hasta ${refColumn.max}`
    }
    return dValue
  }

  // ── EVALUACIÓN DE ALERTAS ─────────────────────────────────────────────────────
  const checkCustomAlerts = (value: string, refColumn: any, currentColumn: any) => {
    let isHigh = false; let isLow = false
    const numValue = Number(value)
    if (value === "" || isNaN(numValue) || !currentColumn) return { isHigh, isLow }
    const labelLower = (currentColumn.label || "").toLowerCase()
    if (labelLower.includes("paciente") || labelLower.includes("control") || labelLower.includes("segundo") || labelLower.includes("muestra")) return { isHigh, isLow }
    const activeGroups = refColumn?.groups || currentColumn?.groups || refColumn?.referenceValue?.groups
    let targetMin = refColumn?.min ?? currentColumn?.min
    let targetMax = refColumn?.max ?? currentColumn?.max
    if (Array.isArray(activeGroups) && patient) {
      const pAge = patient.age ?? 0
      const pSex = (patient.sex || "").toUpperCase()
      const matchedGroup = activeGroups.find((g: any) => {
        const minA = g.minAge !== undefined ? g.minAge : 0
        const maxA = g.maxAge !== undefined ? g.maxAge : 120
        const ageMatches = pAge >= minA && pAge < maxA
        const nameLower = (g.name || "").toLowerCase()
        let sexMatches = true
        if (nameLower.includes("hombre") || nameLower.includes("masculino") || nameLower.includes("varon")) sexMatches = pSex === "M" || pSex === "MASCULINO"
        else if (nameLower.includes("mujer") || nameLower.includes("femenino") || nameLower.includes("dama")) sexMatches = pSex === "F" || pSex === "FEMENINO"
        return ageMatches && sexMatches
      })
      if (matchedGroup) { targetMin = matchedGroup.min; targetMax = matchedGroup.max }
    }
    if (targetMin !== undefined && numValue < Number(targetMin)) isLow = true
    if (targetMax !== undefined && numValue > Number(targetMax)) isHigh = true
    return { isHigh, isLow }
  }

  // ── FUNCIÓN PARA RENDERIZAR UNA CELDA CON ANCHO PORCENTUAL EN LUGAR DE FLEX ──
  const renderCell = (col: any, row: any, widthPercent: number, refColumn: any, boldResult = false, fontSize = 9) => {
    const fieldKey = `${row.id}|${col.id}`
    const dynamicRef = getRefColumnValue(col, refColumn)
    let value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? dynamicRef ?? "")
    if (col.type === "formula" || (col as any).formulaExpression) {
      value = evaluateFormula(col.formulaExpression, row.id, data, customTemplate)
    } else if (typeof value === "string" && (value.toLowerCase().includes("desglose") || value.toLowerCase().includes("grupo"))) {
      value = dynamicRef
    }
    const isResultColumn = col.type === "number" || col.type === "formula" || (!col.isHeaderOnly && !col.isFixed && col.type === "text")
    const { isHigh, isLow } = isResultColumn ? checkCustomAlerts(value, refColumn, col) : { isHigh: false, isLow: false }

    const widthStyle = { width: `${widthPercent}%` }

    return (
      <View key={col.id} style={[widthStyle, col.isHeaderOnly ? { fontFamily: "Helvetica-Bold" } : {}]}>
        {Array.isArray(value) ? (
          value.map((line, lineIdx) => (
            <Text key={lineIdx} style={[s.tableCell, { fontSize: 7.5, marginBottom: 1, color: "#475569" }]}>
              {line}
            </Text>
          ))
        ) : (
          <Text style={[
            (isResultColumn && boldResult) ? s.tableCellBold : s.tableCell,
            { fontSize },
            isHigh ? s.flagHigh : isLow ? s.flagLow : {}
          ]}>
            {`${value || "—"}${isHigh ? " ↑" : isLow ? " ↓" : ""}`}
          </Text>
        )}
      </View>
    )
  }

  // ── AGRUPACIÓN: test-row + sus simple-rows siguientes ────────────────────────
  type Block = {
    sectionHeader: HeaderRow | null
    testRow: TestRow | null
    simpleRows: SimpleRow[]
    emptyRows: EmptyRow[]
  }

  const blocks: Block[] = []
  let current: Block = { sectionHeader: null, testRow: null, simpleRows: [], emptyRows: [] }

  for (const row of customTemplate.rows) {
    if (row.type === "header") {
      if (current.testRow || current.sectionHeader || current.simpleRows.length > 0) {
        blocks.push(current)
      }
      current = { sectionHeader: row, testRow: null, simpleRows: [], emptyRows: [] }
    } else if (row.type === "test") {
      if (current.testRow) {
        blocks.push(current)
        current = { sectionHeader: null, testRow: null, simpleRows: [], emptyRows: [] }
      }
      current.testRow = row
    } else if (row.type === "simple") {
      current.simpleRows.push(row)
    } else if (row.type === "empty") {
      if (current.testRow || current.simpleRows.length > 0) {
        current.emptyRows.push(row)
      }
    }
  }
  if (current.testRow || current.sectionHeader || current.simpleRows.length > 0) {
    blocks.push(current)
  }

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Título del formato */}
      {showTitle && (
        <View style={{ marginBottom: 4 }}>
          <Text style={s.sectionTitle}>{entry.testName}</Text>
        </View>
      )}

      {blocks.map((block, blockIdx) => {
        const testRow = block.testRow
        const totalWeight = testRow ? testRow.columns.reduce((acc: number, c: any) => acc + (c.width ?? 1), 0) : 1
        const refColumn = testRow ? testRow.columns.find((c: any) => c.type === "reference") : null

        return (
          // Usamos wrap={false} para mantener cada sección/bloque como una unidad indivisible.
          // Al usar anchos porcentuales fijos en las celdas en vez de flex, react-pdf calcula
          // correctamente las alturas y evita al 100% el colapso de alto y solapamiento.
          <View
            key={`block-${blockIdx}`}
            wrap={false}
            style={{ marginBottom: 8 }}
          >
            {/* Sub-encabezado de sección */}
            {block.sectionHeader && (
              <View style={{ marginTop: 6, marginBottom: 3 }}>
                <Text style={[s.subSectionTitle, { borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingBottom: 2 }]}>
                  {block.sectionHeader.text}
                </Text>
              </View>
            )}

            {/* Encabezados de columna + primera fila (tipo test) */}
            {testRow && (
              <View>
                {/* Encabezados de columna */}
                <View style={[s.tableHeader, { marginTop: 4 }]}>
                  {testRow.columns.map((col: any) => {
                    const widthPercent = ((col.width ?? 1) / totalWeight) * 100
                    return (
                      <Text key={col.id} style={[s.tableHeaderText, { width: `${widthPercent}%` }]}>
                        {col.label || "—"}
                      </Text>
                    )
                  })}
                </View>
                {/* Fila de datos del testRow */}
                <View style={s.tableRow}>
                  {testRow.columns.map((col: any) => {
                    const widthPercent = ((col.width ?? 1) / totalWeight) * 100
                    return renderCell(col, testRow, widthPercent, refColumn, true, 9)
                  })}
                </View>
              </View>
            )}

            {/* Filas simples (datos de parámetros) */}
            {block.simpleRows.map((row) => {
              const rowTotalWeight = row.columns.reduce((acc: number, c: any) => acc + (c.width ?? 1), 0)
              const rowRefCol = row.columns.find((c: any) => c.type === "reference")
              const isOdd = simpleRowCount % 2 !== 0
              simpleRowCount++
              return (
                <View
                  key={row.id}
                  style={[
                    s.tableRow,
                    {
                      backgroundColor: isOdd ? "#f8fafc" : "#ffffff",
                      paddingVertical: 5.5,
                      paddingHorizontal: 6,
                      borderBottomWidth: 0.5,
                      borderBottomColor: "#e2e8f0",
                    }
                  ]}
                >
                  {row.columns.map((col: any) => {
                    const widthPercent = ((col.width ?? 1) / rowTotalWeight) * 100
                    return renderCell(col, row, widthPercent, rowRefCol, true, 8.5)
                  })}
                </View>
              )
            })}

            {/* Filas vacías de separación */}
            {block.emptyRows.map((row) => (
              <View key={row.id} style={{ height: 6 }} />
            ))}
          </View>
        )
      })}
    </View>
  )
}
