import type { CustomFormatTemplate } from "@/shared/types"

interface FormatPreviewProps {
  template: CustomFormatTemplate
  className?: string
}

const COL_TYPE_LABELS: Record<string, string> = {
  text:      "Texto",
  number:    "Número",
  select:    "Lista",
  reference: "Referencia",
  unit:      "Unidad",
}

export default function FormatPreview({ template, className = "" }: FormatPreviewProps) {
  const { rows } = template

  if (rows.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center text-sm text-white/30 ${className}`}>
        El formato estará vacío. Agrega filas usando los botones de arriba.
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-surface-950 overflow-hidden ${className}`}>
      <div className="border-b border-white/10 bg-white/3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">
        Vista Previa del Formato
      </div>
      <div className="p-4 space-y-1">
        {rows.map((row) => {
          if (row.type === "empty") {
            return (
              <div
                key={row.id}
                className="h-4 rounded border border-dashed border-white/10"
                title="Fila vacía (espaciado)"
              />
            )
          }

          if (row.type === "header") {
            return (
              <div
                key={row.id}
                className="py-1.5 px-1 text-sm font-bold text-white/90 border-b border-white/20"
              >
                {row.text || <span className="italic text-white/30">Membrete sin texto</span>}
              </div>
            )
          }

          if (row.type === "test") {
            if (row.columns.length === 0) {
              return (
                <div key={row.id} className="py-1 px-1 text-xs text-white/30 italic">
                  Fila de prueba sin columnas
                </div>
              )
            }
            return (
              <div
                key={row.id}
                className="grid gap-1 py-1"
                style={{ gridTemplateColumns: row.columns.map(c => `${c.width ?? 1}fr`).join(" ") }}
              >
                {row.columns.map((col) => (
                  <div key={col.id} className="min-w-0">
                    <div className="mb-0.5 text-[10px] font-medium text-white/50 truncate">{col.label || "Sin nombre"}</div>
                    {col.type === "select" ? (
                      <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 truncate">
                        {col.options && col.options.length > 0
                          ? col.options[0] + " ▾"
                          : "Lista vacía ▾"
                        }
                      </div>
                    ) : col.type === "reference" ? (
                      <div className="rounded-md border border-primary-500/20 bg-primary-500/10 px-2 py-1 text-xs text-primary-400">
                        Val. Ref.
                      </div>
                    ) : col.type === "unit" ? (
                      <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/40 italic">
                        Unidad
                      </div>
                    ) : (
                      <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/40">
                        {COL_TYPE_LABELS[col.type] ?? col.type}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
