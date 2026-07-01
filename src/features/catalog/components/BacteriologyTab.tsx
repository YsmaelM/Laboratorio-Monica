import { useState, useEffect } from "react"
import { Shield, Plus, Trash2, Loader2, Save, FileText, Activity } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import toast from "react-hot-toast"

interface BacteriologyConfig {
  antibiotics: string[]
  microorganisms: string[]
  negativeResponses: string[]
}

interface BacteriologyTabProps {
  onRefresh: () => void
}

// 2. Update the main function declaration to accept the prop:
export default function BacteriologyTab({ onRefresh }: BacteriologyTabProps) {
  const [config, setConfig] = useState<BacteriologyConfig>({
    antibiotics: [],
    microorganisms: [],
    negativeResponses: [],
  })
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsGenerating] = useState(false)

  // Estados locales para los inputs de adición rápida
  const [newAntibiotic, setNewAntibiotic] = useState("")
  const [newMicroorganism, setNewMicroorganism] = useState("")
  const [newNegativeResponse, setNewNegativeResponse] = useState("")

  // Cargar configuraciones globales de Firestore al montar la pestaña
  useEffect(() => {
    const loadBacteriologyConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, "config", "bacteriology"))
        if (configDoc.exists()) {
          const data = configDoc.data()
          setConfig({
            antibiotics: data.antibiotics || [],
            microorganisms: data.microorganisms || [],
            negativeResponses: data.negativeResponses || [],
          })
        }
      } catch (err) {
        console.error("Error loading bacteriology configuration:", err)
        toast.error("Error al cargar el catálogo de bacteriología.")
      } finally {
        setLoading(false)
      }
    }
    loadBacteriologyConfig()
  }, [])

  // Guardar la configuración consolidada de vuelta en Firestore
  const handleSaveConfig = async (updatedConfig: BacteriologyConfig) => {
    setIsGenerating(true)
    try {
      await setDoc(doc(db, "config", "bacteriology"), updatedConfig)
      setConfig(updatedConfig)
      toast.success("Catálogo de bacteriología actualizado correctamente")
      onRefresh()
    } catch (err) {
      console.error("Error saving bacteriology configuration:", err)
      toast.error("Error al sincronizar con la base de datos")
    } finally {
      setIsGenerating(false)
    }
  }

  const addItem = (type: keyof BacteriologyConfig, value: string, clearInput: () => void) => {
    const trimmed = value.trim()
    if (!trimmed) return

    if (config[type].some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Este elemento ya se encuentra registrado.")
      return
    }

    const updated = {
      ...config,
      [type]: [...config[type], trimmed].sort((a, b) => a.localeCompare(b))
    }
    handleSaveConfig(updated)
    clearInput()
  }

  const removeItem = (type: keyof BacteriologyConfig, indexToRemove: number) => {
    if (!confirm("¿Seguro que desea eliminar este elemento del catálogo?")) return

    const updated = {
      ...config,
      [type]: config[type].filter((_, idx) => idx !== indexToRemove)
    }
    handleSaveConfig(updated)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary-500" />
        <p>Cargando configuraciones bacteriológicas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Shield className="h-5 w-5 text-emerald-400" />
            Catálogo de Bacteriología
          </h2>
          <p className="mt-0.5 text-sm text-white/50">
            Administra los elementos globales que alimentarán tus formularios de cultivo.
          </p>
        </div>
        {isSaving && (
          <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sincronizando Storage...
          </span>
        )}
      </div>

      {/* Grilla de 3 Columnas para las Secciones de Configuración */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* COLUMNA 1: GESTIÓN DE ANTIBIÓTICOS */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-surface-900 p-4 min-h-[450px]">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
            <Activity className="h-4 w-4 text-purple-400" /> Antibióticos
          </h3>
          <p className="text-xs text-white/40 mb-4">Lista disponible para armar el antibiograma.</p>

          {/* Formulario de adición rápida */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Ej: Ceftazidima"
              value={newAntibiotic}
              onChange={e => setNewAntibiotic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem("antibiotics", newAntibiotic, () => setNewAntibiotic(""))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
            />
            <button
              onClick={() => addItem("antibiotics", newAntibiotic, () => setNewAntibiotic(""))}
              className="rounded-xl bg-primary-600 p-2 text-white hover:bg-primary-500 transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Listado scrolleable */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[350px] scrollbar-thin">
            {config.antibiotics.length === 0 ? (
              <p className="text-xs text-white/30 italic text-center py-8">Sin antibióticos cargados.</p>
            ) : (
              config.antibiotics.map((ab, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/[0.04]">
                  <span>{ab}</span>
                  <button onClick={() => removeItem("antibiotics", idx)} className="text-white/40 hover:text-red-400 transition p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: GESTIÓN DE MICROORGANISMOS */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-surface-900 p-4 min-h-[450px]">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
            <Shield className="h-4 w-4 text-blue-400" /> Microorganismos
          </h3>
          <p className="text-xs text-white/40 mb-4">Gérmenes aislados en cultivos positivos.</p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Ej: Pseudomonas aeruginosa"
              value={newMicroorganism}
              onChange={e => setNewMicroorganism(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem("microorganisms", newMicroorganism, () => setNewMicroorganism(""))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
            />
            <button
              onClick={() => addItem("microorganisms", newMicroorganism, () => setNewMicroorganism(""))}
              className="rounded-xl bg-primary-600 p-2 text-white hover:bg-primary-500 transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[350px] scrollbar-thin">
            {config.microorganisms.length === 0 ? (
              <p className="text-xs text-white/30 italic text-center py-8">Sin microorganismos cargados.</p>
            ) : (
              config.microorganisms.map((mo, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2 text-xs italic text-white/80 transition hover:bg-white/[0.04]">
                  <span>{mo}</span>
                  <button onClick={() => removeItem("microorganisms", idx)} className="text-white/40 hover:text-red-400 transition p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        {/* COLUMNA 3: RESPUESTAS PREDETERMINADAS NEGATIVAS */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-surface-900 p-4 min-h-[450px]">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
            <FileText className="h-4 w-4 text-amber-400" /> Respuestas Negativas
          </h3>
          <p className="text-xs text-white/40 mb-4">Frases preestablecidas para cultivos sin desarrollo.</p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Ej: No se observó desarrollo bacteriano a las 48 horas"
              value={newNegativeResponse}
              onChange={e => setNewNegativeResponse(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem("negativeResponses", newNegativeResponse, () => setNewNegativeResponse(""))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
            />
            <button
              type="button"
              onClick={() => addItem("negativeResponses", newNegativeResponse, () => setNewNegativeResponse(""))}
              className="rounded-xl bg-primary-600 p-2 text-white hover:bg-primary-500 transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[350px] scrollbar-thin">
            {config.negativeResponses.length === 0 ? (
              <p className="text-xs text-white/30 italic text-center py-8">Sin respuestas registradas.</p>
            ) : (
              config.negativeResponses.map((nr, idx) => (
                <div key={idx} className="flex flex-col gap-1 rounded-xl bg-white/[0.02] border border-white/5 p-3 text-xs text-white/80 transition hover:bg-white/[0.04]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="leading-normal flex-1">{nr}</p>
                    <button
                      type="button"
                      onClick={() => removeItem("negativeResponses", idx)}
                      className="text-white/40 hover:text-red-400 transition p-1 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}