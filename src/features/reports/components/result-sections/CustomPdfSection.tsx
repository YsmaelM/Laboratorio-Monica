import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { CustomTestEntry } from "@/shared/types"

interface CustomPdfSectionProps {
  entry: CustomTestEntry
  patient?: any
}

export function CustomPdfSection({ entry, patient }: CustomPdfSectionProps) {
  const { data } = entry
  const customTemplate = entry.customTemplate; // ← Acceso directo y seguro
  console.log("🛠️ PARÁMETRO PACIENTE EN PDF:", patient);

  if (!customTemplate || customTemplate.rows.length === 0) {
    return (
      <Text style={s.tableCell}>Formato sin filas configuradas.</Text>
    )
  }

  let simpleRowCount = 0

  // ── MOTOR EVALUADOR DE FÓRMULAS AUTOMÁTICAS PARA EL PDF ──
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
        if (rawValue === undefined || rawValue === "" || isNaN(numValue)) {
          missingField = true
          break
        }
        replacements.push({ token: match[0], value: numValue.toString() })
      }
      if (missingField) return "—"
      replacements.forEach(({ token, value }) => {
        expression = expression.split(token).join(value)
      })
      if (expression.includes("{") || expression.includes("}")) return "—"
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, "")
      if (!sanitizedExpression.trim()) return "—"
      const result = new Function(`return (${sanitizedExpression})`)()
      if (result === null || result === undefined || isNaN(result) || !isFinite(result)) return "0"
      return Number(result) % 1 === 0 ? result.toString() : Number(result).toFixed(2)
    } catch (error) {
      console.error("Formula parsing error in PDF multi-row support:", error)
      return "Error"
    }
  }

  // ── FUNCIÓN DE EXTRACCIÓN GLOBAL: SIEMPRE MUESTRA TODOS LOS RANGOS EN VERTICAL ──
  const getRefColumnValue = (col: any, refColumn: any) => {
    // Buscamos el origen del arreglo de grupos en la columna de referencia de la fila
    const activeGroups = refColumn?.groups || col?.groups || col?.referenceValue?.groups;

    if (Array.isArray(activeGroups) && activeGroups.length > 0) {
      // ── CAMBIO CLAVE: Eliminamos el buscador de grupo único para el texto visual.
      // Retornamos directamente el array mapeado completo para que el renderizador lo apile hacia abajo.
      return activeGroups.map(
        (g: any) => `${g.name}: ${g.type === "two_point" ? `${g.min ?? 0} - ${g.max ?? 0}` : `Hasta ${g.max ?? 0}`}`
      );
    }

    // Fallback si la celda contiene un texto fijo por defecto del catálogo
    const dValue = col.defaultValue ?? "";
    if (typeof dValue === "string" && (dValue.toLowerCase().includes("desglose") || dValue.toLowerCase().includes("grupo"))) {
      if (refColumn && refColumn.min !== undefined && refColumn.max !== undefined) {
        return `${refColumn.min} - ${refColumn.max}`;
      }
      if (refColumn && refColumn.max !== undefined) {
        return `Hasta ${refColumn.max}`;
      }
    }
    return dValue;
  };

  // ── FUNCIÓN DE EVALUACIÓN DE ALERTAS POR INTERVALOS DE EDAD ──
  const checkCustomAlerts = (value: string, refColumn: any, currentColumn: any) => {
    let isHigh = false
    let isLow = false
    const numValue = Number(value)
    if (value === "" || isNaN(numValue) || !currentColumn) {
      return { isHigh, isLow }
    }
    const labelLower = (currentColumn.label || "").toLowerCase()
    if (labelLower.includes("paciente") || labelLower.includes("control") || labelLower.includes("segundo") || labelLower.includes("muestra")) {
      return { isHigh, isLow }
    }

    const activeGroups = refColumn?.groups || currentColumn?.groups || refColumn?.referenceValue?.groups;
    let targetMin = refColumn?.min ?? currentColumn?.min;
    let targetMax = refColumn?.max ?? currentColumn?.max;

    if (Array.isArray(activeGroups) && patient) {
      const pAge = patient.age ?? 0;
      const pSex = (patient.sex || "").toUpperCase();

      const matchedGroup = activeGroups.find((g: any) => {
        const minA = g.minAge !== undefined ? g.minAge : 0;
        const maxA = g.maxAge !== undefined ? g.maxAge : 120;
        const ageMatches = pAge >= minA && pAge < maxA;

        const nameLower = (g.name || "").toLowerCase();
        let sexMatches = true;
        if (nameLower.includes("hombre") || nameLower.includes("masculino") || nameLower.includes("varon")) {
          sexMatches = pSex === "M" || pSex === "MASCULINO";
        } else if (nameLower.includes("mujer") || nameLower.includes("femenino") || nameLower.includes("dama")) {
          sexMatches = pSex === "F" || pSex === "FEMENINO";
        }
        return ageMatches && sexMatches;
      });

      if (matchedGroup) {
        targetMin = matchedGroup.min;
        targetMax = matchedGroup.max;
      }
    }

    if (targetMin !== undefined && numValue < Number(targetMin)) isLow = true
    if (targetMax !== undefined && numValue > Number(targetMax)) isHigh = true

    return { isHigh, isLow }
  }
  return (
    <View>
      {customTemplate.rows.map((row) => {
        // ── Empty row ──────────────────────────────────────────────
        if (row.type === "empty") {
          return <View key={row.id} style={{ height: 6 }} />
        }

        // ── Header row ─────────────────────────────────────────────
        if (row.type === "header") {
          return (
            <View key={row.id} style={{ marginTop: 6, marginBottom: 3 }}>
              <Text
                style={[s.subSectionTitle, { borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingBottom: 2 }]}
              >
                {row.text}
              </Text>
            </View>
          )
        }

        // ── Test row ───────────────────────────────────────────────
        if (row.type === "test" && row.columns.length > 0) {
          const totalWeight = row.columns.reduce((acc, c) => acc + (c.width ?? 1), 0)
          const refColumn = row.columns.find(c => c.type === "reference")

          return (
            <View key={row.id}>
              {/* Column headers */}
              <View style={[s.tableHeader, { marginTop: 4 }]}>
                {row.columns.map((col) => {
                  const flex = (col.width ?? 1) / totalWeight
                  return (
                    <Text key={col.id} style={[s.tableHeaderText, { flex }]}>
                      {col.label || "—"}
                    </Text>
                  )
                })}
              </View>

              {/* Data row */}
              <View style={s.tableRow}>
                {row.columns.map((col) => {
                  const flex = (col.width ?? 1) / totalWeight
                  const fieldKey = `${row.id}|${col.id}`

                  const dynamicRef = getRefColumnValue(col, refColumn)
                  let value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? dynamicRef ?? "")

                  if (col.type === "formula" || (col as any).formulaExpression) {
                    value = evaluateFormula(col.formulaExpression, row.id, data, customTemplate)
                  } else if (typeof value === "string" && (value.toLowerCase().includes("desglose") || value.toLowerCase().includes("grupo"))) {
                    value = dynamicRef;
                  }

                  const isResultColumn = col.type === "number" || col.type === "formula" || (!col.isHeaderOnly && !col.isFixed && col.type === "text")

                  const { isHigh, isLow } = isResultColumn
                    ? checkCustomAlerts(value, refColumn, col)
                    : { isHigh: false, isLow: false }

                  // ── NUEVO RENDERIZADO CON SOPORTE PARA SALTO DE LÍNEA VERTICAL EN TEST ──
                  return (
                    <View key={col.id} style={[{ flex }, col.isHeaderOnly ? { fontFamily: "Helvetica-Bold" } : {}]}>
                      {Array.isArray(value) ? (
                        value.map((line, lineIdx) => (
                          <Text key={lineIdx} style={[s.tableCell, { fontSize: 7.5, marginBottom: 1, color: "#475569" }]}>
                            {line}
                          </Text>
                        ))
                      ) : (
                        <Text style={[isResultColumn ? s.tableCellBold : s.tableCell, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
                          {`${value || "—"}${isHigh ? " ↑" : isLow ? " ↓" : ""}`}
                        </Text>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          )
        }

        // ── Simple row ─────────────────────────────────────────────
        if (row.type === "simple" && row.columns.length > 0) {
          const totalWeight = row.columns.reduce((acc, c) => acc + (c.width ?? 1), 0)
          const isOdd = simpleRowCount % 2 !== 0
          simpleRowCount++

          const refColumn = row.columns.find(c => c.type === "reference")

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
              {row.columns.map((col) => {
                const flex = (col.width ?? 1) / totalWeight
                const fieldKey = `${row.id}|${col.id}`

                const dynamicRef = getRefColumnValue(col, refColumn)
                let value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? dynamicRef ?? "")

                if (col.type === "formula" || (col as any).formulaExpression) {
                  value = evaluateFormula(col.formulaExpression, row.id, data, customTemplate)
                } else if (typeof value === "string" && (value.toLowerCase().includes("desglose") || value.toLowerCase().includes("grupo"))) {
                  value = dynamicRef;
                }

                const isResultColumn = col.type === "number" || col.type === "formula" || (!col.isHeaderOnly && !col.isFixed && col.type === "text")

                const { isHigh, isLow } = isResultColumn
                  ? checkCustomAlerts(value, refColumn, col)
                  : { isHigh: false, isLow: false }

                // ── NUEVO RENDERIZADO CON SOPORTE PARA SALTO DE LÍNEA VERTICAL ──
                return (
                  <View key={col.id} style={[{ flex }, col.isHeaderOnly ? { fontFamily: "Helvetica-Bold" } : {}]}>
                    {Array.isArray(value) ? (
                      value.map((line, lineIdx) => (
                        <Text key={lineIdx} style={[s.tableCell, { fontSize: 7.5, marginBottom: 1, color: "#475569" }]}>
                          {line}
                        </Text>
                      ))
                    ) : (
                      <Text style={[isResultColumn ? s.tableCellBold : s.tableCell, { fontSize: 8.5 }, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
                        {`${value || "—"}${isHigh ? " ↑" : isLow ? " ↓" : ""}`}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          )
        }

        return null
      })}
    </View>
  )
}   
