import { useEffect, useRef } from "react"
import type { SimpleTestEntry } from "@/shared/types"

interface SimpleTestFormProps {
  entry: SimpleTestEntry
  onChange: (updated: SimpleTestEntry) => void
  onNext?: () => void // <-- 1. AÑADIMOS LA FUNCIÓN PARA AVANZAR AL SIGUIENTE
}

export default function SimpleTestForm({ entry, onChange, onNext }: SimpleTestFormProps) {
  const { catalogId, data } = entry
  const resultInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      resultInputRef.current?.focus()
      resultInputRef.current?.select() // Selecciona el texto para que al escribir se borre el anterior
    }, 50)

    return () => clearTimeout(timer)
  }, [catalogId])

  // ── MANEJADOR DE TECLAS ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault() // Evita que el formulario haga un submit nativo de la página
      if (onNext) {
        onNext() // Ejecuta la función para saltar al siguiente input
      }
    }
  }

  // ── FUNCIÓN PARA DAR FORMATO AUTOMÁTICO A REFVALUE ──
  const renderRefValue = () => {
    const ref = data.refValue as {
      type?: "single_point" | "two_point" | "group";
      min?: number;
      max?: number;
      groups?: Array<{ name: string; type: string; min?: number; max?: number }>;
    } | undefined

    if (!ref || (!ref.type && ref.max === undefined && !ref.groups)) {
      return <span className="text-white/30 italic text-xs">Sin valor de ref.</span>
    }

    if (ref.type === "two_point" || (ref.min !== undefined && ref.max !== undefined)) {
      return <div className="text-xs font-medium text-white/80 py-1">{ref.min} - {ref.max}</div>
    }

    if (ref.type === "single_point" || ref.max !== undefined) {
      return <div className="text-xs font-medium text-white/80 py-1">Máx: {ref.max}</div>
    }

    if (ref.type === "group" && Array.isArray(ref.groups)) {
      return (
        <div className="mt-1 space-y-1 rounded-lg bg-white/5 p-2 border border-white/5 max-h-32 overflow-y-auto scrollbar-thin">
          {ref.groups.map((g: any, index: number) => (
            <div key={index} className="flex justify-between text-[11px] border-b border-white/5 pb-1 last:border-0 last:pb-0">
              <span className="text-white/50 font-normal">{g.name}:</span>
              <span className="text-white/90 font-medium ml-2">
                {g.min !== undefined && g.max !== undefined ? `${g.min} - ${g.max}` : g.max}
              </span>
            </div>
          ))}
        </div>
      )
    }

    return <span className="text-white/30 text-xs">Formato no soportado</span>
  }

  const updateData = (field: string, value: string | number) => {
    const updated = {
      ...entry,
      status: "entered" as const,
      data: { ...data, [field]: value },
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Result */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Resultado *</label>
          <input
            ref={resultInputRef}
            type="text"
            value={data.result}
            onChange={(e) => updateData("result", e.target.value)}
            onKeyDown={handleKeyDown} // <-- 2. ESCUCHAMOS LA TECLA ENTER AQUÍ
            placeholder="Ej: 95"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Unidad</label>
          <input
            type="text"
            value={data.unit}
            onChange={(e) => updateData("unit", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white/70 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Ref Range */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Valor de Ref.</label>
          <div className="w-full min-h-[42px] flex flex-col justify-center rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-white/70">
            {renderRefValue()}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Método</label>
          <input
            type="text"
            value={data.method}
            onChange={(e) => updateData("method", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white/70 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  )
}
