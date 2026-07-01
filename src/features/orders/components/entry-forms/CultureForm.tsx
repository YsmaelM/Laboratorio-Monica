import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Search } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { CultureEntry, AntibiogramRow } from "@/shared/types"

interface CultureFormProps {
  entry: CultureEntry
  onChange: (updated: CultureEntry) => void
}

interface BacteriologyConfig {
  antibiotics: string[]
  microorganisms: string[]
  negativeResponses: string[]
}

const SAMPLE_TYPES = [
  "Orina", "Sangre", "Herida", "Esputo", "Heces", "Secreción Vaginal",
  "Secreción Uretral", "Líquido Cefalorraquídeo", "Otro",
]

export default function CultureForm({ entry, onChange }: CultureFormProps) {
  const { data } = entry

  const [dbConfig, setConfig] = useState<BacteriologyConfig>({
    antibiotics: [],
    microorganisms: [],
    negativeResponses: [],
  })
  const [loadingConfig, setLoadingConfig] = useState(true)

  //  CORRECCIÓN: Indexamos por el ID único string de la fila, no por el número de índice idx
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const loadLiveConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, "config", "bacteriology"))
        if (configDoc.exists()) {
          const res = configDoc.data()
          setConfig({
            antibiotics: res.antibiotics || [],
            microorganisms: res.microorganisms || [],
            negativeResponses: res.negativeResponses || [],
          })
        }
      } catch (err) {
        console.error("Error retrieving live bacteriology config fields:", err)
      } finally {
        setLoadingConfig(false)
      }
    }
    loadLiveConfig()
  }, [])

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null)
    window.addEventListener("click", handleOutsideClick)
    return () => window.removeEventListener("click", handleOutsideClick)
  }, [])

  const updateField = (field: string, value: string) => {
    onChange({
      ...entry,
      status: "entered",
      data: { ...data, [field]: value },
    })
  }

  const addAntibiogramRow = () => {
    const newId = crypto.randomUUID()
    const newRow: AntibiogramRow = {
      id: newId,
      antibiotic: "",
      result: "S"
    }

    // Inicializamos el término de búsqueda de esta nueva fila con su ID
    setSearchTerms(prev => ({ ...prev, [newId]: "" }))

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
    const rowToRemove = rows[idx]

    if (rowToRemove?.id) {
      // Limpiamos el rastro de búsqueda del ID eliminado para evitar fugas de memoria
      setSearchTerms(prev => {
        const updated = { ...prev }
        delete updated[rowToRemove.id]
        return updated
      })
    }

    rows.splice(idx, 1)

    onChange({
      ...entry,
      status: "entered",
      data: { ...data, antibiogram: rows },
    })
  }

  const isPositive = data.cultureResult === "Positive" || data.cultureResult === "Positivo"
  const isCustomNegativeSelected = data.cultureResultNotes === "custom_response"

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-6 text-white/50 text-xs gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
        Sincronizando listas del catálogo bacteriológico...
      </div>
    )
  }

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
          <label className="mb-1 block text-xs font-medium text-white/60">Tinción de Gram (Opcional)</label>
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
            onClick={() => {
              onChange({
                ...entry,
                status: "entered",
                data: { ...data, cultureResult: "Negativo", organism: "", antibiogram: [], cultureResultNotes: "" }
              })
            }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${!isPositive
                ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/50"
                : "border border-white/10 text-white/50 hover:bg-white/5"
              }`}
          >
            Negativo
          </button>
          <button
            type="button"
            onClick={() => updateField("cultureResult", "Positivo")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${isPositive
                ? "bg-red-600/20 text-red-300 border border-red-500/50"
                : "border border-white/10 text-white/50 hover:bg-white/5"
              }`}
          >
            Positivo
          </button>
        </div>
      </div>

      {/* Detalles de Cultivo Negativo */}
      {!isPositive && (
        <div className="space-y-4 animate-slide-up">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Observación / Respuesta Predeterminada</label>
            <select
              value={isCustomNegativeSelected ? "custom_response" : (data.cultureResultNotes || "")}
              onChange={(e) => {
                const val = e.target.value
                if (val === "custom_response") {
                  onChange({
                    ...entry,
                    status: "entered",
                    data: { ...data, cultureResultNotes: "custom_response", customNegativeText: "" }
                  })
                } else {
                  onChange({
                    ...entry,
                    status: "entered",
                    data: { ...data, cultureResultNotes: val, customNegativeText: undefined }
                  })
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="" className="bg-surface-900">Seleccionar frase del catálogo...</option>
              {dbConfig.negativeResponses.map((phrase, idx) => (
                <option key={idx} value={phrase} className="bg-surface-900">{phrase}</option>
              ))}
              <option value="custom_response" className="bg-surface-950 font-semibold text-primary-400">✏️ Respuesta personalizada...</option>
            </select>
          </div>

          {isCustomNegativeSelected && (
            <div className="animate-slide-up">
              <label className="mb-1 block text-xs font-medium text-primary-400">Escribe la respuesta personalizada aquí:</label>
              <textarea
                rows={2}
                value={data.customNegativeText || ""}
                onChange={(e) => updateField("customNegativeText", e.target.value)}
                placeholder="Escribe la observación libre para este informe negativo..."
                className="w-full rounded-xl border border-primary-500/30 bg-primary-500/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Detalles de Cultivo Positivo */}
      {isPositive && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Organismo / Microorganismo Aislado *</label>
              <select
                value={data.organism || ""}
                onChange={(e) => updateField("organism", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="" className="bg-surface-900">Seleccionar germen...</option>
                {dbConfig.microorganisms.map((mo, idx) => (
                  <option key={idx} value={mo} className="bg-surface-900 italic">{mo}</option>
                ))}
              </select>
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

          {/* Antibiograma */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-white/60">Antibiograma Automatizado</label>
              <button
                type="button"
                onClick={addAntibiogramRow}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600/20 px-3 py-1.5 text-xs font-medium text-primary-300 transition hover:bg-primary-600/30"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Antibiótico
              </button>
            </div>

            {data.antibiogram && data.antibiogram.length > 0 ? (
              <div className="overflow-visible rounded-xl border border-white/10 bg-surface-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60 bg-white/5">
                      <th className="px-4 py-2.5 text-left font-medium">Antibiótico</th>
                      <th className="px-4 py-2.5 text-center font-medium w-24">S</th>
                      <th className="px-4 py-2.5 text-center font-medium w-24">I</th>
                      <th className="px-4 py-2.5 text-center font-medium w-24">R</th>
                      <th className="px-4 py-2.5 text-center font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.antibiogram.map((row, idx) => {
                      const rowId = row.id || `fallback-${idx}`

                      // Obtenemos el término de búsqueda usando el ID único de la fila
                      const currentSearch = searchTerms[rowId] ?? row.antibiotic ?? ""
                      const filteredAntibiotics = dbConfig.antibiotics.filter(ab =>
                        ab.toLowerCase().includes(currentSearch.toLowerCase())
                      )

                      return (
                        <tr key={rowId} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-2 relative overflow-visible">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                                <input
                                  type="text"
                                  value={currentSearch}
                                  placeholder="Escribe para buscar..."
                                  onFocus={() => setActiveDropdown(rowId)}
                                  onChange={(e) => {
                                    // Guardamos el string tipeado asociado estrictamente al ID único
                                    setSearchTerms(prev => ({ ...prev, [rowId]: e.target.value }))
                                    setActiveDropdown(rowId)
                                    if (row.antibiotic) updateAntibiogramRow(idx, "antibiotic", "")
                                  }}
                                  className="w-full bg-transparent text-xs text-white outline-none placeholder-white/20"
                                />
                                <Search className="h-3.5 w-3.5 text-white/20 shrink-0 ml-1" />
                              </div>

                              {activeDropdown === rowId && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-surface-900 p-1 shadow-2xl scrollbar-thin animate-slide-up">
                                  {filteredAntibiotics.length === 0 ? (
                                    <p className="p-2 text-center text-[11px] text-white/40 italic">No encontrado</p>
                                  ) : (
                                    filteredAntibiotics.map((ab, abIdx) => (
                                      <button
                                        key={abIdx}
                                        type="button"
                                        onClick={() => {
                                          updateAntibiogramRow(idx, "antibiotic", ab)
                                          setSearchTerms(prev => ({ ...prev, [rowId]: ab }))
                                          setActiveDropdown(null)
                                        }}
                                        className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-white/80 hover:bg-primary-600 hover:text-white transition"
                                      >
                                        {ab}
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-1.5 text-center">
                            <input
                              type="radio"
                              name={`result-${rowId}`} // Nombre único por ID de fila para los radio buttons
                              checked={row.result === "S"}
                              onChange={() => updateAntibiogramRow(idx, "result", "S")}
                              className="h-4 w-4 text-emerald-500 focus:ring-0 bg-white/5 border-white/10"
                            />
                          </td>
                          <td className="px-4 py-1.5 text-center">
                            <input
                              type="radio"
                              name={`result-${rowId}`}
                              checked={row.result === "I"}
                              onChange={() => updateAntibiogramRow(idx, "result", "I")}
                              className="h-4 w-4 text-amber-500 focus:ring-0 bg-white/5 border-white/10"
                            />
                          </td>
                          <td className="px-4 py-1.5 text-center">
                            <input
                              type="radio"
                              name={`result-${rowId}`}
                              checked={row.result === "R"}
                              onChange={() => updateAntibiogramRow(idx, "result", "R")}
                              className="h-4 w-4 text-red-500 focus:ring-0 bg-white/5 border-white/10"
                            />
                          </td>
                          <td className="px-4 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeAntibiogramRow(idx)}
                              className="rounded p-1 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-white/30 italic py-2">No se han añadido antibióticos a esta prueba aún.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
