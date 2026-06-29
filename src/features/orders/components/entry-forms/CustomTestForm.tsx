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
  // Si la columna tiene cargado un arreglo de grupos, buscamos el del paciente actual
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
    // Fallback si no hay paciente cargado en pantalla: listamos todos los grupos cortos
    return col.groups.map((g: any) => `${g.name}: ${g.type === "two_point" ? `${g.min}-${g.max}` : g.max}`).join(" | ")
  }

  // Si no es por grupos, simplemente retorna el valor plano (ej: "12 - 16")
  return col.defaultValue ?? ""
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

    if (value !== "" && !isNaN(Number(value)) && refColumn) {
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

  //  CORRECCIÓN EN EL INPUT DE TEXTO: Si es columna de referencia, calculamos el valor dinámico real siempre
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
                const fieldKey = `${row.id}_${col.id}`

                //  CORRECCIÓN EN EL PROCESADO DE CELDA PADRE: Forzamos la consulta dinámica si es de referencia
                const cellDefault = col.type === "reference" || Array.isArray(col.groups)
                  ? getFormRefText(col, patient)
                  : (col.defaultValue ?? "")

                const value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? cellDefault)

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

                //  CORRECCIÓN EN EL PROCESADO DE CELDA PADRE (Fila Simple)
                const cellDefault = col.type === "reference" || Array.isArray(col.groups)
                  ? getFormRefText(col, patient)
                  : (col.defaultValue ?? "")

                const value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? cellDefault)

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
