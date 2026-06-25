import type { CustomTestEntry, FormatColumn } from "@/shared/types"

interface CustomTestFormProps {
  entry: CustomTestEntry
  onChange: (updated: CustomTestEntry) => void
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"

function CellInput({
  col,
  rowId,
  value,
  onChange,
}: {
  col: FormatColumn
  rowId: string
  value: string
  onChange: (key: string, val: string) => void
}) {
  const fieldKey = `${rowId}_${col.id}`

  if (col.type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className={inputBase}
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
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder="0"
        className={inputBase}
      />
    )
  }

  // text / reference / unit — all use a simple text input
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={
        col.type === "reference" ? "Valor de referencia" :
        col.type === "unit" ? "Unidad" :
        col.label || "..."
      }
      className={inputBase}
    />
  )
}

export default function CustomTestForm({ entry, onChange }: CustomTestFormProps) {
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
        Este formato custom no tiene filas configuradas. Edítalo desde la pestaña{" "}
        <strong>Formatos</strong> en el Catálogo.
      </div>
    )
  }

  let simpleRowCount = 0

  return (
    <div className="space-y-3">
      {customTemplate.rows.map((row) => {
        // ── Empty row ─────────────────────────────────────
        if (row.type === "empty") {
          return <div key={row.id} className="h-3" />
        }

        // ── Header row ────────────────────────────────────
        if (row.type === "header") {
          return (
            <div
              key={row.id}
              className="border-b border-white/10 pb-1 pt-2 text-sm font-semibold text-white/80"
            >
              {row.text}
            </div>
          )
        }

        // ── Test row ──────────────────────────────────────
        if (row.type === "test") {
          if (row.columns.length === 0) {
            return (
              <div key={row.id} className="text-xs text-white/30 italic">
                (fila de prueba sin columnas)
              </div>
            )
          }

          return (
            <div
              key={row.id}
              className="grid gap-3"
              style={{
                gridTemplateColumns: row.columns
                  .map((c) => `${c.width ?? 1}fr`)
                  .join(" "),
              }}
            >
              {row.columns.map((col) => (
                <div key={col.id}>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    {col.label || "—"}
                  </label>
                  {col.isHeaderOnly ? (
                    <div className="flex h-9 items-center px-3 rounded-xl border border-white/5 bg-white/2 text-sm font-semibold text-primary-400">
                      {col.label}
                    </div>
                  ) : col.isFixed ? (
                    <div className="flex h-9 items-center px-3 rounded-xl border border-white/5 bg-white/2 text-sm text-white/70">
                      {data[`${row.id}_${col.id}`] ?? col.defaultValue ?? ""}
                    </div>
                  ) : (
                    <CellInput
                      col={col}
                      rowId={row.id}
                      value={data[`${row.id}_${col.id}`] ?? ""}
                      onChange={updateField}
                    />
                  )}
                </div>
              ))}
            </div>
          )
        }

        // ── Simple row ────────────────────────────────────
        if (row.type === "simple") {
          if (row.columns.length === 0) {
            return (
              <div key={row.id} className="text-xs text-white/30 italic">
                (fila simple sin columnas)
              </div>
            )
          }

          const isOdd = simpleRowCount % 2 !== 0
          simpleRowCount++

          return (
            <div
              key={row.id}
              className={`grid gap-3 items-center py-2 px-3 rounded-xl border border-white/5 ${
                isOdd ? "bg-white/[0.04]" : "bg-white/[0.01]"
              }`}
              style={{
                gridTemplateColumns: row.columns
                  .map((c) => `${c.width ?? 1}fr`)
                  .join(" "),
              }}
            >
              {row.columns.map((col) => (
                <div key={col.id}>
                  {col.isHeaderOnly ? (
                    <div className="flex h-9 items-center px-1 text-sm font-semibold text-primary-400 truncate">
                      {col.label}
                    </div>
                  ) : col.isFixed ? (
                    <div className="flex h-9 items-center px-1 text-sm font-medium text-white/70 truncate">
                      {data[`${row.id}_${col.id}`] ?? col.defaultValue ?? ""}
                    </div>
                  ) : (
                    <CellInput
                      col={col}
                      rowId={row.id}
                      value={data[`${row.id}_${col.id}`] ?? ""}
                      onChange={updateField}
                    />
                  )}
                </div>
              ))}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
