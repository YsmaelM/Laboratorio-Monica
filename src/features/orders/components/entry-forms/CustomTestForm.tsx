import type { CustomTestEntry, FormatColumn } from "@/shared/types"

interface CustomTestFormProps {
  entry: CustomTestEntry
  onChange: (updated: CustomTestEntry) => void
  patient?: any
}

const inputBase =
  "w-full rounded-xl border px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 transition-all duration-200"

// ── FUNCIÓN DE EXTRACCIÓN DINÁMICA DE RANGOS PARA LA PANTALLA ──
const getFormRefText = (col: any, patient: any) => {
  if (col && Array.isArray(col.groups) && col.groups.length > 0) {
    if (patient) {
      const pAge = patient.age ?? 0
      const pSex = patient.sex

      const matchedGroup = col.groups.find((g: any) => {
        const nameLower = g.name.toLowerCase()
        if (nameLower.includes("niño") || nameLower.includes("infantil") || nameLower.includes("pediat")) return pAge < 14
        if (nameLower.includes("adulto")) return pAge >= 14
        if (nameLower.includes("hombre") || nameLower.includes("masculino") || nameLower === "m" || nameLower.includes("varon")) return pSex === "M"
        if (nameLower.includes("mujer") || nameLower.includes("femenino") || nameLower === "f") return pSex === "F"
        return false
      })

      if (matchedGroup) {
        return matchedGroup.type === "two_point"
          ? `${matchedGroup.min ?? 0} - ${matchedGroup.max ?? 0}`
          : `Hasta ${matchedGroup.max ?? 0}`
      }
    }
    return col.groups.map((g: any) => `${g.name}: ${g.type === "two_point" ? `${g.min}-${g.max}` : g.max}`).join(" | ")
  }
  return col.defaultValue ?? ""
}

// ── MOTOR EVALUADOR DE FÓRMULAS AUTOMÁTICAS EN TIEMPO REAL ──
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
      const targetColId = match[1] // Corregido: Extrae el ID limpio sin las llaves {}

      // 1. Intentar buscar primero en la fila actual
      let fieldKey = `${currentRowId}_${targetColId}`
      let rawValue = data[fieldKey]

      // 2. RADAR MULTI-FILA MEJORADO
      // Si no está en la fila actual, escaneamos de forma exhaustiva el resto de las filas
      if ((rawValue === undefined || rawValue === "") && customTemplate?.rows) {
        for (const row of customTemplate.rows) {
          if (row.columns && Array.isArray(row.columns)) {
            const foundCol = row.columns.find((c: any) => c.id === targetColId)

            if (foundCol) {
              // DETECTOR CRÍTICO: Si la columna que encontramos arriba es OTRA fórmula, 
              // la calculamos en cascada de forma recursiva inmediatamente
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

      // Convertimos a número de manera limpia
      const numValue = Number(rawValue)

      // Si el campo sigue vacío o no es un número válido, marcamos como faltante
      if (rawValue === undefined || rawValue === "" || isNaN(numValue)) {
        missingField = true
        break
      }

      replacements.push({ token: match[0], value: numValue.toString() })
    }

    if (missingField) return "—"

    // Aplicar los reemplazos de números en la ecuación
    replacements.forEach(({ token, value }) => {
      expression = expression.split(token).join(value)
    })

    if (expression.includes("{") || expression.includes("}")) {
      return "—"
    }

    // Sanitización y cálculo nativo de potencias y operaciones
    const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, "")
    if (!sanitizedExpression.trim()) return "—"

    const result = new Function(`return (${sanitizedExpression})`)()

    if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
      return "0"
    }

    return Number(result) % 1 === 0 ? result.toString() : Number(result).toFixed(2)
  } catch (error) {
    console.error("Formula parsing error with multi-row support:", error)
    return "Error"
  }
}


function CellInput({
  col,
  rowId,
  value,
  onChange,
  refColumn,
  patient,
}: {
  col: FormatColumn
  rowId: string
  value: string
  onChange: (key: string, val: string) => void
  refColumn?: FormatColumn
  patient?: any
}) {
  const fieldKey = `${rowId}_${col.id}`

  // ── 1. AGREGAMOS EL COMPORTAMIENTO RENDER DE LA FÓRMULA AUTOMÁTICA ──
  if (col.type === "formula") {
    return (
      <div className="flex h-9 items-center px-3 rounded-xl border border-primary-500/20 bg-primary-500/5 text-sm font-bold text-primary-400">
        {value || "—"}
      </div>
    )
  }

  if (col.type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className={`${inputBase} border-white/10 bg-white/5 focus:border-primary-500 focus:ring-primary-500`}
      >
        <option value="" className="bg-surface-900">— Seleccionar —</option>
        {(col.options ?? []).map((opt) => (
          <option key={opt} value={opt} className="bg-surface-900">
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (col.type === "number") {
    let borderStyles = "border-white/10 bg-white/5 focus:border-primary-500 focus:ring-primary-500"

    const labelLower = (col.label || "").toLowerCase()
    const isExcluded =
      labelLower.includes("paciente") ||
      labelLower.includes("control") ||
      labelLower.includes("segundo") ||
      labelLower.includes("muestra") ||
      labelLower.includes("tiempo pt")

    if (!isExcluded && value !== "" && !isNaN(Number(value)) && refColumn) {
      const numValue = Number(value)
      if (refColumn.min !== undefined && numValue < refColumn.min) {
        borderStyles = "border-amber-500/50 bg-amber-500/5 focus:border-amber-500 focus:ring-amber-500 text-amber-300"
      } else if (refColumn.max !== undefined && numValue > refColumn.max) {
        borderStyles = "border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500 text-red-300"
      } else {
        borderStyles = "border-emerald-500/30 bg-emerald-500/5 focus:border-emerald-500 focus:ring-emerald-500"
      }
    }

    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder="0"
        className={`${inputBase} ${borderStyles}`}
      />
    )
  }

  const displayValue = col.type === "reference" || Array.isArray(col.groups)
    ? getFormRefText(col, patient)
    : value

  return (
    <input
      type="text"
      value={displayValue}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={
        col.type === "reference" ? "Valor de referencia" :
          col.type === "unit" ? "Unidad" :
            col.label || "..."
      }
      className={`${inputBase} border-white/10 bg-white/5 focus:border-primary-500 focus:ring-primary-500`}
    />
  )
}

export default function CustomTestForm({ entry, onChange, patient }: CustomTestFormProps) {
  const { customTemplate, data } = entry

  const updateField = (key: string, value: string) => {
    onChange({
      ...entry,
      status: "entered",
      data: { ...data, [key]: value },
    })
  }

  if (!customTemplate || customTemplate.rows.length === 0) {
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-400">
        Este formato custom no tiene filas configuradas.
      </div>
    )
  }

  let simpleRowCount = 0

  return (
    <div className="space-y-3">
      {customTemplate.rows.map((row) => {
        if (row.type === "empty") return <div key={row.id} className="h-3" />
        if (row.type === "header") return <div key={row.id} className="border-b border-white/10 pb-1 pt-2 text-sm font-semibold text-white/80">{row.text}</div>

        // ── Test row ──────────────────────────────────────
        if (row.type === "test" && row.columns.length > 0) {
          const refColumn = row.columns.find((c) => c.type === "reference")

          return (
            <div
              key={row.id}
              className="grid gap-3"
              style={{ gridTemplateColumns: row.columns.map((c) => `${c.width ?? 1}fr`).join(" ") }}
            >
              {row.columns.map((col) => {
                const fieldKey = `${row.id}_${col.id}`;

                const cellDefault = col.type === "reference" || Array.isArray(col.groups)
                  ? getFormRefText(col, patient)
                  : (col.defaultValue ?? "")

                // ── 2. INTERCEPTAMOS EL VALOR DEL PADRE SI ES UNA FÓRMULA ──
                let value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? cellDefault)
                if (col.type === "formula") {
                  value = evaluateFormula(col.formulaExpression, row.id, data, customTemplate)
                }

                return (
                  <div key={col.id}>
                    <label className="mb-1 block text-xs font-medium text-white/50">{col.label || "—"}</label>
                    {col.isHeaderOnly ? (
                      <div className="flex h-9 items-center px-3 rounded-xl border border-white/5 bg-white/2 text-sm font-semibold text-primary-400">{col.label}</div>
                    ) : col.isFixed ? (
                      <div className="flex h-9 items-center px-3 rounded-xl border border-white/5 bg-white/2 text-sm text-white/70">{value || "—"}</div>
                    ) : (
                      <CellInput
                        col={col}
                        rowId={row.id}
                        value={value}
                        onChange={updateField}
                        refColumn={refColumn}
                        patient={patient}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        }

        // ── Simple row ────────────────────────────────────
        if (row.type === "simple" && row.columns.length > 0) {
          const isOdd = simpleRowCount % 2 !== 0
          simpleRowCount++
          const refColumn = row.columns.find((c) => c.type === "reference")

          return (
            <div
              key={row.id}
              className={`grid gap-3 items-center py-2 px-3 rounded-xl border border-white/5 ${isOdd ? "bg-white/[0.04]" : "bg-white/[0.01]"}`}
              style={{ gridTemplateColumns: row.columns.map((c) => `${c.width ?? 1}fr`).join(" ") }}
            >
              {row.columns.map((col) => {
                const fieldKey = `${row.id}_${col.id}`

                const cellDefault = col.type === "reference" || Array.isArray(col.groups)
                  ? getFormRefText(col, patient)
                  : (col.defaultValue ?? "")

                // ── 3. INTERCEPTAMOS EL VALOR DEL PADRE EN FILAS SIMPLES ──
                let value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? cellDefault)
                if (col.type === "formula") {
                  value = evaluateFormula(col.formulaExpression, row.id, data, customTemplate)
                }



                return (
                  <div key={col.id}>
                    {col.isHeaderOnly ? (
                      <div className="flex h-9 items-center px-1 text-sm font-semibold text-primary-400 truncate">{col.label}</div>
                    ) : col.isFixed ? (
                      <div className="flex h-9 items-center px-1 text-sm font-medium text-white/70 truncate">{value || "—"}</div>
                    ) : (
                      <CellInput
                        col={col}
                        rowId={row.id}
                        value={value}
                        onChange={updateField}
                        refColumn={refColumn}
                        patient={patient}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
