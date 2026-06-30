import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { CustomTestEntry } from "@/shared/types"

interface CustomPdfSectionProps {
  entry: CustomTestEntry
  patient?: any
}

export function CustomPdfSection({ entry, patient }: CustomPdfSectionProps) {
  const { customTemplate, data } = entry
  console.log("Estructura de filas que llegan al PDF:", JSON.stringify(customTemplate?.rows, null, 2));
  console.log(" Datos del paciente que recibe el PDF Custom:", patient);

  if (!customTemplate || customTemplate.rows.length === 0) {
    return (
      <Text style={s.tableCell}>Formato sin filas configuradas.</Text>
    )
  }

  let simpleRowCount = 0

  // ── MOTOR EVALUADOR DE FÓRMULAS AUTOMÁTICAS PARA EL PDF (SOPORTE MULTI-FILA EN CASCADA) ──
  const evaluateFormula = (
    formulaExpression: string | undefined,
    currentRowId: string,
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
        const targetColId = match[1] // Extrae el ID limpio sin las llaves {}

        // 1. Intentar buscar primero en la fila actual
        let fieldKey = `${currentRowId}_${targetColId}`
        let rawValue = data[fieldKey]

        // 2. RADAR MULTI-FILA EXHAUSTIVO EN EL PDF
        if ((rawValue === undefined || rawValue === "") && customTemplate?.rows) {
          for (const row of customTemplate.rows) {
            if (row.columns && Array.isArray(row.columns)) {
              const foundCol = row.columns.find((c: any) => c.id === targetColId)

              if (foundCol) {
                // Si la columna encontrada arriba es OTRA fórmula, la calculamos en cascada inmediatamente
                if (foundCol.type === "formula") {
                  rawValue = evaluateFormula(foundCol.formulaExpression, row.id, data, customTemplate)
                } else {
                  fieldKey = `${row.id}_${targetColId}`
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

      // Aplicar los reemplazos numéricos globales en la ecuación
      replacements.forEach(({ token, value }) => {
        expression = expression.split(token).join(value)
      })

      if (expression.includes("{") || expression.includes("}")) {
        return "—"
      }

      // Sanitización matemática estricta
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, "")
      if (!sanitizedExpression.trim()) return "—"

      const result = new Function(`return (${sanitizedExpression})`)()

      if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
        return "0"
      }

      return Number(result) % 1 === 0 ? result.toString() : Number(result).toFixed(2)
    } catch (error) {
      console.error("Formula parsing error in PDF multi-row support:", error)
      return "Error"
    }
  }


  // ── FUNCIÓN DE EXTRACCIÓN MEJORADA CONTRA STRINGS ESTÁTICOS ──
  const getRefColumnValue = (col: any, refColumn: any) => {
    if (col && Array.isArray(col.groups) && col.groups.length > 0) {
      if (patient) {
        const pAge = patient.age ?? 0;
        const pSex = patient.sex;

        const matchedGroup = col.groups.find((g: any) => {
          const nameLower = g.name.toLowerCase();
          if (nameLower.includes("niño") || nameLower.includes("infantil") || nameLower.includes("pediat")) return pAge < 14;
          if (nameLower.includes("adulto")) return pAge >= 14;
          if (nameLower.includes("hombre") || nameLower.includes("masculino") || nameLower === "m" || nameLower.includes("varon")) return pSex === "M";
          if (nameLower.includes("mujer") || nameLower.includes("femenino") || nameLower === "f") return pSex === "F";
          return false;
        });

        if (matchedGroup) {
          return matchedGroup.type === "two_point"
            ? `${matchedGroup.min ?? 0} - ${matchedGroup.max ?? 0}`
            : `Hasta ${matchedGroup.max ?? 0}`;
        }
      }
      return col.groups.map((g: any) => `${g.name}: ${g.type === "two_point" ? `${g.min}-${g.max}` : g.max}`).join(" | ");
    }

    const dValue = col.defaultValue ?? "";
    if (dValue.toLowerCase().includes("desglose") || dValue.toLowerCase().includes("grupo")) {
      if (refColumn && refColumn.min !== undefined && refColumn.max !== undefined) {
        return `${refColumn.min} - ${refColumn.max}`;
      }
      if (refColumn && refColumn.max !== undefined) {
        return `Hasta ${refColumn.max}`;
      }
    }

    return dValue;
  };

  const checkCustomAlerts = (value: string, refColumn: any, currentColumn: any) => {
    let isHigh = false
    let isLow = false
    const numValue = Number(value)

    if (!refColumn || value === "" || isNaN(numValue) || !currentColumn) {
      return { isHigh, isLow }
    }

    const labelLower = (currentColumn.label || "").toLowerCase()
    if (
      labelLower.includes("paciente") ||
      labelLower.includes("control") ||
      labelLower.includes("segundo") ||
      labelLower.includes("muestra") ||
      labelLower.includes("tiempo")
    ) {
      return { isHigh, isLow }
    }

    let targetMin = refColumn.min
    let targetMax = refColumn.max

    if (refColumn.refType === "group" && Array.isArray(refColumn.groups) && patient) {
      const pAge = patient.age ?? 0
      const pSex = patient.sex

      const matchedGroup = refColumn.groups.find((g: any) => {
        const nameLower = g.name.toLowerCase()
        if (nameLower.includes("niño") || nameLower.includes("infantil") || nameLower.includes("pediat")) return pAge < 14;
        if (nameLower.includes("adulto")) return pAge >= 14;
        if (nameLower.includes("hombre") || nameLower.includes("masculino") || nameLower === "m" || nameLower.includes("varon")) return pSex === "M";
        if (nameLower.includes("mujer") || nameLower.includes("femenino") || nameLower === "f") return pSex === "F";
        return false
      })

      if (matchedGroup) {
        targetMin = matchedGroup.min
        targetMax = matchedGroup.max
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
                  const fieldKey = `${row.id}_${col.id}`

                  const dynamicRef = getRefColumnValue(col, refColumn)
                  let value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? dynamicRef ?? "")

                  //  CÁLCULO DE FÓRMULA EN FILA TEST
                  if (col.type === "formula") {
                    value = evaluateFormula(col.formulaExpression, row.id, data, customTemplate)
                  }

                  if (typeof value === "string" && (value.toLowerCase().includes("desglose") || value.toLowerCase().includes("grupo"))) {
                    value = dynamicRef;
                  }

                  const isResultColumn = col.type === "number" || col.type === "formula" || (!col.isHeaderOnly && !col.isFixed && col.type === "text")

                  const { isHigh, isLow } = isResultColumn
                    ? checkCustomAlerts(value, refColumn, col)
                    : { isHigh: false, isLow: false }

                  return (
                    <Text
                      key={col.id}
                      style={[
                        isResultColumn ? s.tableCellBold : s.tableCell,
                        { flex },
                        col.isHeaderOnly ? { fontFamily: "Helvetica-Bold" } : {},
                        isHigh ? s.flagHigh : isLow ? s.flagLow : {}
                      ]}
                    >
                      {value || "—"} {isHigh ? "↑" : isLow ? "↓" : ""}
                    </Text>
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
                const fieldKey = `${row.id}_${col.id}`

                const dynamicRef = getRefColumnValue(col, refColumn)
                let value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? dynamicRef ?? "")

                if (col.type === "formula") {
                  value = evaluateFormula(col.formulaExpression, row.id, data, customTemplate)
                }

                // Limpieza si el string guardado en el form es la frase estática
                if (typeof value === "string" && (value.toLowerCase().includes("desglose") || value.toLowerCase().includes("grupo"))) {
                  value = dynamicRef;
                }

                const isResultColumn = col.type === "number" || col.type === "formula" || (!col.isHeaderOnly && !col.isFixed && col.type === "text")

                const { isHigh, isLow } = isResultColumn
                  ? checkCustomAlerts(value, refColumn, col)
                  : { isHigh: false, isLow: false }

                return (
                  <Text
                    key={col.id}
                    style={[
                      isResultColumn ? s.tableCellBold : s.tableCell,
                      { flex, fontSize: 8.5 },
                      col.isHeaderOnly ? { fontFamily: "Helvetica-Bold" } : {},
                      isHigh ? s.flagHigh : isLow ? s.flagLow : {}
                    ]}
                  >
                    {value || "—"} {isHigh ? "↑" : isLow ? "↓" : ""}
                  </Text>
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
