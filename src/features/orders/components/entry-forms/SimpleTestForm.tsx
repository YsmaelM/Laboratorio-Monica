import type { SimpleTestEntry } from "@/shared/types"

interface SimpleTestFormProps {
  entry: SimpleTestEntry
  onChange: (updated: SimpleTestEntry) => void
}

export default function SimpleTestForm({ entry, onChange }: SimpleTestFormProps) {
  const { data } = entry

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
            type="text"
            value={data.result}
            onChange={(e) => updateData("result", e.target.value)}
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
          <label className="mb-1 block text-xs font-medium text-white/60">Rango de Referencia</label>
          <input
            type="text"
            value={data.refRange}
            onChange={(e) => updateData("refRange", e.target.value)}
            placeholder="Ej: 70 - 100"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white/70 placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
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
