import type { CustomTestEntry, FormatColumn } from "@/shared/types"
import { useEffect, useRef } from "react"


interface CustomTestFormProps {
  entry: CustomTestEntry
  onChange: (updated: CustomTestEntry) => void
  patient?: any
  onNext?: () => void
}

const inputBase =
  "w-full rounded-xl border px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 transition-all duration-200"

// ── FUNCIÓN DE EXTRACCIÓN DINÁMICA DE RANGOS PARA LA PANTALLA (POR INTERVALOS NUMÉRICOS) ──
const getFormRefText = (col: any, patient: any) => {
  if (col && Array.isArray(col.groups) && col.groups.length > 0) {
    if (patient) {
      const pAge = patient.age ?? 0

      // RADAR MATEMÁTICO: Buscamos el grupo exacto donde encaja la edad del paciente
      const matchedGroup = col.groups.find((g: any) => {
        const minA = g.minAge !== undefined ? g.minAge : 0
        const maxA = g.maxAge !== undefined ? g.maxAge : 120

        // Evaluamos si la edad real del paciente cae dentro del tramo (Desde minAge hasta MaxAge)
        return pAge >= minA && pAge < maxA
      })

      if (matchedGroup) {
        return matchedGroup.type === "two_point"
          ? `${matchedGroup.min ?? 0} - ${matchedGroup.max ?? 0}`
          : `Hasta ${matchedGroup.max ?? 0}`
      }
    }
    // Fallback si no hay paciente en pantalla: listamos los rangos de todos los grupos numéricos
    return col.groups
      .map((g: any) => `${g.name} (${g.minAge ?? 0}-${g.maxAge ?? 120}a): ${g.type === "two_point" ? `${g.min ?? 0}-${g.max ?? 0}` : g.max ?? 0}`)
      .join(" \n ")
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
  isFirst,
  inputsRefMap,
  onKeyDown,
}: {
  col: FormatColumn
  rowId: string
  value: string
  onChange: (key: string, val: string) => void
  refColumn?: FormatColumn
  patient?: any
  isFirst?: boolean
  inputsRefMap: React.MutableRefObject<Map<string, HTMLInputElement | HTMLSelectElement | null>>
  onKeyDown: (e: React.KeyboardEvent, currentKey: string) => void
}) {
  const fieldKey = `${rowId}|${col.id}`

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
        ref={(el) => { inputsRefMap.current.set(fieldKey, el) }}
        onKeyDown={(e) => onKeyDown(e, fieldKey)}
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

      // ── NUEVO RADAR DE EDAD POR INTERVALOS NUMÉRICOS EN LA CELDA ──
      let targetMin = refColumn.min
      let targetMax = refColumn.max

      // Evaluamos refType o verificamos directamente la existencia del arreglo de grupos
      if (Array.isArray(refColumn.groups) && patient) {
        const pAge = patient.age ?? 0
        // Añadimos el operador "?" por seguridad
        const matchedGroup = refColumn.groups?.find((g: any) => {
          const minA = g.minAge !== undefined ? g.minAge : 0
          const maxA = g.maxAge !== undefined ? g.maxAge : 120
          return pAge >= minA && pAge < maxA
        })
        if (matchedGroup) {
          targetMin = matchedGroup.min
          targetMax = matchedGroup.max
        }
      }

      // Evaluación matemática final con el rango del grupo detectado
      if (targetMin !== undefined && numValue < targetMin) {
        borderStyles = "border-amber-500/50 bg-amber-500/5 focus:border-amber-500 focus:ring-amber-500 text-amber-300"
      } else if (targetMax !== undefined && numValue > targetMax) {
        borderStyles = "border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500 text-red-300"
      } else {
        borderStyles = "border-emerald-500/30 bg-emerald-500/5 focus:border-emerald-500 focus:ring-emerald-500"
      }
    }

    return (
      <input
        ref={(el) => { inputsRefMap.current.set(fieldKey, el) }}
        onKeyDown={(e) => onKeyDown(e, fieldKey)}
        type="number"
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder="0"
        autoFocus={isFirst}
        className={`${inputBase} ${borderStyles}`}
      />
    )
  }

  const displayValue = col.type === "reference" || Array.isArray(col.groups)
    ? getFormRefText(col, patient)
    : value

  return (
    <input
      ref={(el) => { inputsRefMap.current.set(fieldKey, el) }}
      onKeyDown={(e) => onKeyDown(e, fieldKey)}
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

export default function CustomTestForm({ entry, onChange, patient, onNext }: CustomTestFormProps) {
  const { catalogId, customTemplate, data } = entry

  // ── INICIO DE CÓDIGO NUEVO PARA EL FOCO ──
  const editableInputsOrder: string[] = []
  const inputsRefMap = useRef<Map<string, HTMLInputElement | HTMLSelectElement | null>>(new Map())

  if (customTemplate?.rows) {
    customTemplate.rows.forEach((row: any) => {
      if (row.columns && (row.type === "test" || row.type === "simple")) {
        row.columns.forEach((col: any) => {
          // Filtramos exactamente igual que en tu JSX (Evitamos fijos, fórmulas o encabezados)
          if (
            !col.isHeaderOnly &&
            !col.isFixed &&
            col.type !== "formula" &&
            col.type !== "reference" &&
            col.type !== "unit"
          ) {
            editableInputsOrder.push(`${row.id}|${col.id}`)
          }
        })
      }
    })
  }

  useEffect(() => {
    if (editableInputsOrder.length > 0) {
      const firstInputKey = editableInputsOrder[0]
      const timer = setTimeout(() => {
        const el = inputsRefMap.current.get(firstInputKey)
        if (el) {
          el.focus()
          if ('select' in el) el.select()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [catalogId])

  const handleKeyDown = (e: React.KeyboardEvent, currentKey: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const currentIndex = editableInputsOrder.indexOf(currentKey)

      if (currentIndex !== -1 && currentIndex < editableInputsOrder.length - 1) {
        const nextInputKey = editableInputsOrder[currentIndex + 1]

        // Un micro setTimeout asegura que React termine de procesar el render antes de mover el cursor
        setTimeout(() => {
          const nextEl = inputsRefMap.current?.get(nextInputKey)
          console.log({ currentKey, nextInputKey, nextEl, totalOrder: editableInputsOrder })

          if (nextEl) {
            nextEl.focus()
            if ('select' in nextEl) nextEl.select()
          }
        }, 10)
      } else {
        if (onNext) onNext()
      }
    }
  }
  // ── FIN DE CÓDIGO NUEVO PARA EL FOCO ──

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
  let isFirstEditableInputFound = false

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
                const fieldKey = `${row.id}|${col.id}`

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
                      <div className="flex h-9 items-center px-3 rounded-xl border border-white/5 bg-white/2 text-sm whitespace-pre-line text-white/70">{value || "—"}</div>
                    ) : (
                      // Modificación directa aquí:
                      (() => {
                        const shouldFocus = !isFirstEditableInputFound && col.type !== "formula";
                        if (shouldFocus) isFirstEditableInputFound = true;

                        return (
                          <CellInput
                            col={col}
                            rowId={row.id}
                            value={value}
                            onChange={updateField}
                            refColumn={refColumn}
                            patient={patient}
                            isFirst={shouldFocus} // ← Pasamos la propiedad de enfoque
                            inputsRefMap={inputsRefMap}
                            onKeyDown={handleKeyDown}
                          />
                        );
                      })()
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
                const fieldKey = `${row.id}|${col.id}`

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
                      <div className="flex h-9 items-center px-3 rounded-xl border border-white/5 bg-white/2 text-sm font-semibold text-primary-400">{col.label}</div>
                    ) : col.isFixed ? (
                      <div className="flex h-9 items-center px-3 rounded-xl border border-white/5 bg-white/2 text-sm text-white/70">{value || "—"}</div>
                    ) : (
                      // Modificación directa aquí:
                      (() => {
                        const shouldFocus = !isFirstEditableInputFound && col.type !== "formula";
                        if (shouldFocus) isFirstEditableInputFound = true;

                        return (
                          <CellInput
                            col={col}
                            rowId={row.id}
                            value={value}
                            onChange={updateField}
                            refColumn={refColumn}
                            patient={patient}
                            isFirst={shouldFocus} // ← Pasamos la propiedad de enfoque
                            inputsRefMap={inputsRefMap}
                            onKeyDown={handleKeyDown}
                          />
                        );
                      })()
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
