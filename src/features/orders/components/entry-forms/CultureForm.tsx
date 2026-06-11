import { Plus, Trash2 } from "lucide-react"
import type { CultureEntry, AntibiogramRow } from "@/shared/types"

interface CultureFormProps {
  entry: CultureEntry
  onChange: (updated: CultureEntry) => void
}

const SAMPLE_TYPES = [
  "Orina", "Sangre", "Herida", "Esputo", "Heces", "Secreción Vaginal",
  "Secreción Uretral", "Líquido Cefalorraquídeo", "Otro",
]

const COMMON_ANTIBIOTICS = [
  "Amoxicilina", "Ampicilina", "Amikacina", "Ciprofloxacina", "Ceftriaxona",
  "Cefazolina", "Cefotaxima", "Clindamicina", "Eritromicina", "Gentamicina",
  "Imipenem", "Levofloxacina", "Meropenem", "Nitrofurantoína", "Penicilina",
  "Trimetoprim/Sulfametoxazol", "Vancomicina",
]

export default function CultureForm({ entry, onChange }: CultureFormProps) {
  const { data } = entry

  const updateField = (field: string, value: string) => {
    onChange({
      ...entry,
      status: "entered",
      data: { ...data, [field]: value },
    })
  }

  const addAntibiogramRow = () => {
    const newRow: AntibiogramRow = { antibiotic: "", result: "S" }
    onChange({
      ...entry,
      status: "entered",
      data: {
        ...data,
        antibiogram: [...(data.antibiogram || []), newRow],
      },
    })
  }

  const updateAntibiogramRow = (idx: number, field: keyof AntibiogramRow, value: string) => {
    const rows = [...(data.antibiogram || [])]
    rows[idx] = { ...rows[idx], [field]: value }
    onChange({
      ...entry,
      status: "entered",
      data: { ...data, antibiogram: rows },
    })
  }

  const removeAntibiogramRow = (idx: number) => {
    const rows = [...(data.antibiogram || [])]
    rows.splice(idx, 1)
    onChange({
      ...entry,
      status: "entered",
      data: { ...data, antibiogram: rows },
    })
  }

  const isPositive = data.cultureResult === "Positive" || data.cultureResult === "Positivo"

  return (
    <div className="space-y-6">
      {/* Top row: Sample Type & Gram Stain */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Tipo de Muestra *</label>
          <select
            value={data.sampleType}
            onChange={(e) => updateField("sampleType", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="" className="bg-surface-900">Seleccionar...</option>
            {SAMPLE_TYPES.map(s => (
              <option key={s} value={s} className="bg-surface-900">{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Tinción de Gram</label>
          <input
            type="text"
            value={data.gramStain || ""}
            onChange={(e) => updateField("gramStain", e.target.value)}
            placeholder="Ej: Cocos gram positivos en racimos"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Culture Result Toggle */}
      <div>
        <label className="mb-2 block text-xs font-medium text-white/60">Resultado del Cultivo *</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateField("cultureResult", "Negativo")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              !isPositive
                ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/50"
                : "border border-white/10 text-white/50 hover:bg-white/5"
            }`}
          >
            Negativo
          </button>
          <button
            type="button"
            onClick={() => updateField("cultureResult", "Positivo")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              isPositive
                ? "bg-red-600/20 text-red-300 border border-red-500/50"
                : "border border-white/10 text-white/50 hover:bg-white/5"
            }`}
          >
            Positivo
          </button>
        </div>
      </div>

      {/* Conditional: Positive Culture Details */}
      {isPositive && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Organismo *</label>
              <input
                type="text"
                value={data.organism || ""}
                onChange={(e) => updateField("organism", e.target.value)}
                placeholder="Ej: Escherichia coli"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Conteo de Colonias</label>
              <input
                type="text"
                value={data.colonyCount || ""}
                onChange={(e) => updateField("colonyCount", e.target.value)}
                placeholder="Ej: >100,000 UFC/mL"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Antibiogram */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-white/60">Antibiograma</label>
              <button
                type="button"
                onClick={addAntibiogramRow}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600/20 px-3 py-1.5 text-xs font-medium text-primary-300 transition hover:bg-primary-600/30"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Antibiótico
              </button>
            </div>

            {(data.antibiogram && data.antibiogram.length > 0) ? (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60">
                      <th className="px-4 py-2.5 text-left font-medium">Antibiótico</th>
                      <th className="px-4 py-2.5 text-center font-medium w-24">S</th>
                      <th className="px-4 py-2.5 text-center font-medium w-24">I</th>
                      <th className="px-4 py-2.5 text-center font-medium w-24">R</th>
                      <th className="px-4 py-2.5 text-center font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.antibiogram.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-1.5">
                          <select
                            value={row.antibiotic}
                            onChange={(e) => updateAntibiogramRow(idx, "antibiotic", e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="" className="bg-surface-900">Seleccionar...</option>
                            {COMMON_ANTIBIOTICS.map(ab => (
                              <option key={ab} value={ab} className="bg-surface-900">{ab}</option>
                            ))}
                          </select>
                        </td>
                        {(["S", "I", "R"] as const).map(val => (
                          <td key={val} className="px-4 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => updateAntibiogramRow(idx, "result", val)}
                              className={`h-8 w-8 rounded-full text-xs font-bold transition ${
                                row.result === val
                                  ? val === "S" ? "bg-emerald-500 text-white"
                                  : val === "I" ? "bg-yellow-500 text-white"
                                  : "bg-red-500 text-white"
                                  : "border border-white/20 text-white/40 hover:bg-white/10"
                              }`}
                            >
                              {val}
                            </button>
                          </td>
                        ))}
                        <td className="px-4 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeAntibiogramRow(idx)}
                            className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/40">
                No se han agregado antibióticos al antibiograma.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">Notas Adicionales</label>
        <textarea
          value={data.notes || ""}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={2}
          placeholder="Observaciones adicionales..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </div>
  )
}
