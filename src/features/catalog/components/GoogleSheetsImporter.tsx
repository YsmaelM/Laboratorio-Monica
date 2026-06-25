import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import { FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Loader2, HelpCircle } from "lucide-react"
import type { ReferenceValue } from "@/shared/types"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedRow {
  code: string
  name: string
  category: string
  unit: string
  method: string
  refValue: ReferenceValue | null
  refType: "single_point" | "two_point" | "none"
  rawRefCols: string
  order: number
  valid: boolean
  errors: string[]
}

interface ImportResult {
  success: number
  failed: number
  skipped: number
  rows: Array<{ name: string; status: "ok" | "fail" | "skip"; message?: string }>
}

// ── CSV parser ─────────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim())
      cur = ""
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

// ── Detect ref value type and build ReferenceValue ────────────────────────────
function buildRefValue(col1: string, col2?: string): { ref: ReferenceValue | null; type: "single_point" | "two_point" | "none"; label: string } {
  const v1 = col1?.trim() ?? ""
  const v2 = col2?.trim() ?? ""

  const num1 = parseFloat(v1.replace(",", "."))
  const num2 = parseFloat(v2.replace(",", "."))

  // two_point: both columns have valid numbers
  if (v1 && v2 && !isNaN(num1) && !isNaN(num2)) {
    return {
      type: "two_point",
      label: `${num1} – ${num2}`,
      ref: { type: "two_point", min: num1, max: num2 }
    }
  }

  // single_point: first column has a number (upper limit only)
  if (v1 && !isNaN(num1)) {
    return {
      type: "single_point",
      label: `Hasta ${num1}`,
      ref: { type: "single_point", max: num1 }
    }
  }

  return { type: "none", label: "—", ref: null }
}

// ── Google Sheets URL → CSV export URL ────────────────────────────────────────
function toCSVUrl(input: string): string | null {
  try {
    const url = new URL(input.trim())
    // https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=GID
    const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)
    if (!match) return null
    const sheetId = match[1]
    const gid = url.hash.match(/gid=(\d+)/)?.[1] ?? "0"
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
  } catch {
    return null
  }
}

// ── Remove undefined helper (same pattern as useCatalogMutation) ──────────────
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) return obj.map(removeUndefined)
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [k, v]) => {
      if (v !== undefined) acc[k] = removeUndefined(v)
      return acc
    }, {} as any)
  }
  return obj
}

// ─────────────────────────────────────────────────────────────────────────────
export default function GoogleSheetsImporter({ onImportDone }: { onImportDone?: () => void }) {
  const [url, setUrl] = useState("")
  const [hasHeader, setHasHeader] = useState(true)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  // ── Fetch & parse CSV ───────────────────────────────────────────────────────
  const handleFetch = async () => {
    setError(null)
    setResult(null)
    setPreview([])

    const csvUrl = toCSVUrl(url)
    if (!csvUrl) {
      setError("URL inválida. Asegúrate de pegar la URL completa de Google Sheets.")
      return
    }

    setLoading(true)
    try {
      const resp = await fetch(csvUrl)
      if (!resp.ok) throw new Error(`Error HTTP ${resp.status}. ¿La hoja es pública?`)
      const text = await resp.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim())

      const dataLines = hasHeader ? lines.slice(1) : lines
      const rows = dataLines.map((line, idx): ParsedRow => {
        const cols = parseCSVLine(line)
        const errors: string[] = []

        const code = cols[0] ?? ""
        const name = cols[1] ?? ""
        const category = cols[2] ?? ""
        const unit = cols[3] ?? ""
        const method = cols[4] ?? ""
        const refCol1 = cols[5] ?? ""
        const refCol2 = cols[6] ?? ""
        const orderRaw = cols[7] ?? ""

        if (!name) errors.push("Nombre vacío")
        if (!code) errors.push("Código vacío")

        const { ref, type, label } = buildRefValue(refCol1, refCol2)
        const order = parseInt(orderRaw) || idx + 1

        return {
          code: code.trim(),
          name: name.trim(),
          category: category.trim() || "General",
          unit: unit.trim(),
          method: method.trim(),
          refValue: ref,
          refType: type,
          rawRefCols: label,
          order,
          valid: errors.length === 0,
          errors,
        }
      }).filter(r => r.name || r.code)

      setPreview(rows)
      setShowPreview(true)
    } catch (e: any) {
      setError(e.message ?? "Error al obtener los datos.")
    } finally {
      setLoading(false)
    }
  }

  // ── Import to Firestore ─────────────────────────────────────────────────────
  const handleImport = async () => {
    const validRows = preview.filter(r => r.valid)
    if (!validRows.length) return

    setLoading(true)
    const res: ImportResult = { success: 0, failed: 0, skipped: 0, rows: [] }

    for (const row of preview) {
      if (!row.valid) {
        res.skipped++
        res.rows.push({ name: row.name || row.code, status: "skip", message: row.errors.join(", ") })
        continue
      }

      try {
        const item: any = removeUndefined({
          name: row.name,
          code: row.code,
          category: row.category,
          format: "simple",
          isQuickAction: false,
          order: row.order,
          active: true,
          simpleDefaults: {
            unit: row.unit,
            method: row.method,
            refValue: row.refValue ?? null,
          },
        })
        await addDoc(collection(db, "test_catalog"), item)
        res.success++
        res.rows.push({ name: row.name, status: "ok" })
      } catch (e: any) {
        res.failed++
        res.rows.push({ name: row.name, status: "fail", message: e.message })
      }
    }

    setLoading(false)
    setResult(res)
    setShowPreview(false)
    if (res.success > 0 && onImportDone) onImportDone()
  }

  const validCount = preview.filter(r => r.valid).length
  const invalidCount = preview.filter(r => !r.valid).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Importar desde Google Sheets</h3>
          <p className="text-xs text-white/50">Importa pruebas de formato simple con sus valores de referencia</p>
        </div>
      </div>

      {/* Guide toggle */}
      <div className="rounded-xl border border-white/5 bg-white/2 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide(v => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm text-white/70 hover:text-white transition"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary-400" />
            Formato requerido de la hoja de cálculo
          </span>
          {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showGuide && (
          <div className="border-t border-white/5 px-4 py-4 space-y-3">
            <p className="text-xs text-white/60">
              La hoja debe tener columnas en este orden exacto (la primera fila puede ser cabecera):
            </p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="text-xs text-left w-full">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    {["Col A — Código", "Col B — Nombre", "Col C — Categoría", "Col D — Unidad", "Col E — Método", "Col F — Ref. mín (o única)", "Col G — Ref. máx", "Col H — Orden"].map(h => (
                      <th key={h} className="px-3 py-2 whitespace-nowrap font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-white/70 border-t border-white/5">
                    <td className="px-3 py-2 font-mono">GLU</td>
                    <td className="px-3 py-2">Glucosa</td>
                    <td className="px-3 py-2">Química</td>
                    <td className="px-3 py-2">mg/dL</td>
                    <td className="px-3 py-2">Enzimático</td>
                    <td className="px-3 py-2 text-emerald-400">70</td>
                    <td className="px-3 py-2 text-emerald-400">110</td>
                    <td className="px-3 py-2">1</td>
                  </tr>
                  <tr className="text-white/70 border-t border-white/5">
                    <td className="px-3 py-2 font-mono">HB</td>
                    <td className="px-3 py-2">Hemoglobina</td>
                    <td className="px-3 py-2">Hematología</td>
                    <td className="px-3 py-2">g/dL</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-amber-400">16</td>
                    <td className="px-3 py-2 text-white/30">(vacío)</td>
                    <td className="px-3 py-2">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400"></span>Dos valores → rango mín–máx (dos puntos)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400"></span>Un valor → límite superior (un punto)</span>
            </div>
            <p className="text-xs text-white/40">
              La hoja debe ser <strong className="text-white/60">pública</strong> (Compartir → "Cualquier persona con el enlace puede ver").
            </p>
          </div>
        )}
      </div>

      {/* URL input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/80">URL de Google Sheets</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasHeader"
            checked={hasHeader}
            onChange={e => setHasHeader(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500"
          />
          <label htmlFor="hasHeader" className="text-sm text-white/70 cursor-pointer">
            La primera fila es cabecera (ignorar)
          </label>
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={!url.trim() || loading}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {loading ? "Obteniendo datos..." : "Obtener y Previsualizar"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <XCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && showPreview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-white/60">{preview.length} filas encontradas</span>
              {validCount > 0 && (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-400">
                  {validCount} válidas
                </span>
              )}
              {invalidCount > 0 && (
                <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs text-red-400">
                  {invalidCount} con errores
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/5 text-white/60 border-b border-white/10">
                  <tr>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">Código</th>
                    <th className="px-3 py-2.5">Nombre</th>
                    <th className="px-3 py-2.5">Categoría</th>
                    <th className="px-3 py-2.5">Unidad</th>
                    <th className="px-3 py-2.5">Tipo Ref.</th>
                    <th className="px-3 py-2.5">Valor Ref.</th>
                    <th className="px-3 py-2.5">Problemas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.map((row, i) => (
                    <tr key={i} className={row.valid ? "text-white/80" : "text-red-300/80 bg-red-500/5"}>
                      <td className="px-3 py-2">
                        {row.valid
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        }
                      </td>
                      <td className="px-3 py-2 font-mono text-white/50">{row.code}</td>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2 text-white/60">{row.category}</td>
                      <td className="px-3 py-2 text-white/60">{row.unit || "—"}</td>
                      <td className="px-3 py-2">
                        {row.refType === "two_point" && (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                            Dos puntos
                          </span>
                        )}
                        {row.refType === "single_point" && (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
                            Un punto
                          </span>
                        )}
                        {row.refType === "none" && (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-primary-400 font-mono text-[11px]">{row.rawRefCols}</td>
                      <td className="px-3 py-2 text-red-400 text-[11px]">{row.errors.join(", ") || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {validCount > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-300">
                Se importarán <strong>{validCount}</strong> prueba(s) al catálogo.
                {invalidCount > 0 && ` Las ${invalidCount} filas con errores serán omitidas.`}
              </p>
              <button
                type="button"
                onClick={handleImport}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 shrink-0 ml-4"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? "Importando..." : `Importar ${validCount} prueba(s)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import result */}
      {result && (
        <div className="rounded-xl border border-white/10 bg-surface-950 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Resultado de la importación</span>
          </div>
          <div className="flex gap-6 px-4 py-4 text-sm border-b border-white/5">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{result.success}</div>
              <div className="text-white/50 text-xs mt-0.5">Importadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{result.failed}</div>
              <div className="text-white/50 text-xs mt-0.5">Con error</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white/30">{result.skipped}</div>
              <div className="text-white/50 text-xs mt-0.5">Omitidas</div>
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
            {result.rows.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                {r.status === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                {r.status === "fail" && <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                {r.status === "skip" && <AlertTriangle className="h-3.5 w-3.5 text-white/30 shrink-0" />}
                <span className="text-xs text-white/70 flex-1">{r.name}</span>
                {r.message && <span className="text-[11px] text-white/40 truncate max-w-[200px]">{r.message}</span>}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => { setResult(null); setUrl(""); setPreview([]) }}
              className="text-sm text-primary-400 hover:underline"
            >
              Realizar otra importación
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
