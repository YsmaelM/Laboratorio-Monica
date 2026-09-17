import { useState } from "react"
import type { CustomFormatTemplate } from "@/shared/types"
import { checkRowVisibility } from "@/shared/lib/formatConditions"
import { Eye, FileText, Sparkles } from "lucide-react"

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
  const [simulatedValues, setSimulatedValues] = useState<Record<string, string>>({})
  const [previewMode, setPreviewMode] = useState<"form" | "pdf">("form")

  if (rows.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 p-8 text-center text-sm text-white/30 ${className}`}>
        El formato estará vacío. Agrega filas usando los botones de arriba.
      </div>
    )
  }

  const handleValueChange = (key: string, val: string) => {
    setSimulatedValues((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-surface-950 overflow-hidden ${className}`}>
      {/* Header with preview mode toggle */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/3 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
          <Sparkles className="h-3.5 w-3.5 text-primary-400" />
          <span>Vista Previa Interactiva</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-white/10 bg-surface-900 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setPreviewMode("form")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
              previewMode === "form"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Eye className="h-3 w-3" />
            Captura
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("pdf")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
              previewMode === "pdf"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <FileText className="h-3 w-3" />
            PDF Real
          </button>
        </div>
      </div>

      {previewMode === "pdf" && (
        <div className="border-b border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-[11px] text-purple-300">
          Simulando aspecto impreso: Se omiten las filas de control ("Ocultar en PDF").
        </div>
      )}

      <div className="p-4 space-y-1.5">
        {rows.map((row) => {
          // Si estamos en modo PDF y la fila está marcada para ocultarse en PDF, no se muestra
          if (previewMode === "pdf" && row.hideInPdf) {
            return null
          }

          // Evaluación de regla condicional
          const isVisible = checkRowVisibility(row, simulatedValues, template)
          if (!isVisible) {
            return null
          }

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
                className="flex items-center justify-between py-1.5 px-1 text-sm font-bold text-white/90 border-b border-white/20"
              >
                <span>{row.text || <span className="italic text-white/30">Membrete sin texto</span>}</span>
                {row.hideInPdf && previewMode === "form" && (
                  <span className="text-[10px] font-normal text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                    Oculto en PDF
                  </span>
                )}
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
                className={`py-1.5 rounded-lg ${row.hideInPdf && previewMode === "form" ? "border border-purple-500/30 bg-purple-500/5 p-2" : ""}`}
              >
                {row.hideInPdf && previewMode === "form" && (
                  <div className="mb-1 text-[10px] font-medium text-purple-300">
                    Fila de Control (Solo captura, no se imprime):
                  </div>
                )}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: row.columns.map(c => `${c.width ?? 1}fr`).join(" ") }}
                >
                  {row.columns.map((col) => {
                    const fieldKey = `${row.id}|${col.id}`
                    const currentVal = simulatedValues[fieldKey] ?? col.defaultValue ?? col.options?.[0] ?? ""

                    return (
                      <div key={col.id} className="min-w-0">
                        <div className="mb-0.5 text-[10px] font-medium text-white/50 truncate">
                          {col.label || "Sin nombre"}
                        </div>
                        {col.isHeaderOnly ? (
                          <div className="h-6" />
                        ) : col.type === "select" ? (
                          <select
                            value={currentVal}
                            onChange={(e) => handleValueChange(fieldKey, e.target.value)}
                            className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200 focus:border-amber-400 focus:outline-none"
                          >
                            {(col.options && col.options.length > 0 ? col.options : ["Sin opciones"]).map((opt) => (
                              <option key={opt} value={opt} className="bg-surface-900 text-white">
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : col.type === "reference" ? (
                          <div className="rounded-md border border-primary-500/20 bg-primary-500/10 px-2 py-1 text-xs text-primary-400 truncate">
                            {col.defaultValue || "Val. Ref."}
                          </div>
                        ) : col.type === "unit" ? (
                          <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/40 italic truncate">
                            {col.defaultValue || "Unidad"}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={currentVal}
                            placeholder={col.defaultValue || `${COL_TYPE_LABELS[col.type] ?? col.type}...`}
                            onChange={(e) => handleValueChange(fieldKey, e.target.value)}
                            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }

          if (row.type === "simple") {
            if (row.columns.length === 0) {
              return (
                <div key={row.id} className="py-1 px-1 text-xs text-white/30 italic">
                  Fila simple sin columnas
                </div>
              )
            }
            return (
              <div
                key={row.id}
                className={`grid gap-1 py-1.5 px-2 rounded border border-white/5 ${
                  row.hideInPdf && previewMode === "form"
                    ? "border-purple-500/30 bg-purple-500/5"
                    : "odd:bg-white/5 even:bg-white/[0.02]"
                }`}
                style={{ gridTemplateColumns: row.columns.map(c => `${c.width ?? 1}fr`).join(" ") }}
              >
                {row.columns.map((col) => {
                  const fieldKey = `${row.id}|${col.id}`
                  const currentVal = simulatedValues[fieldKey] ?? col.defaultValue ?? ""

                  return (
                    <div key={col.id} className="min-w-0 flex items-center">
                      <span className={`text-xs truncate ${col.isFixed ? "text-white/90 font-medium" : "text-white/50 italic"}`}>
                        {col.isHeaderOnly ? "" : (currentVal || col.defaultValue || (col.isFixed ? "" : col.label || "..."))}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
