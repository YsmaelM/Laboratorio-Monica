import { Plus, Trash2 } from "lucide-react"
import type { ReferenceValue } from "@/shared/types"

interface ReferenceValuesEditorProps {
  value?: ReferenceValue
  onChange: (newValue: ReferenceValue) => void
}

export default function ReferenceValuesEditor({ value, onChange }: ReferenceValuesEditorProps) {
  const currentType = value?.type || "two_point"

  const handleTypeChange = (type: "single_point" | "two_point" | "group" | "sinRef") => {
    if (type === "single_point") {
      onChange({
        type,
        max: value?.max || 0,
      })
    } else if (type === "two_point") {
      onChange({
        type,
        min: value?.min || 0,
        max: value?.max || 0,
      })
    } else if (type === "sinRef") {
      onChange({
        type,
      })
    } else {
      onChange({
        type,
        groups: value?.groups || [
          { name: "Adultos", type: "two_point", min: 0, max: 0, minAge: 12, maxAge: 120 },
          { name: "Niños", type: "single_point", max: 0, minAge: 0, maxAge: 12 },
        ],
      })
    }
  }

  const handleFieldChange = (field: string, val: any) => {
    onChange({
      ...value,
      type: currentType,
      [field]: val,
    } as ReferenceValue)
  }

  const handleGroupChange = (index: number, field: string, val: any) => {
    if (!value?.groups) return
    const updatedGroups = [...value.groups]
    updatedGroups[index] = {
      ...updatedGroups[index],
      [field]: val,
    }
    onChange({
      ...value,
      groups: updatedGroups,
    })
  }

  const addGroup = () => {
    const updatedGroups = [
      ...(value?.groups || []),
      { name: "Nuevo Grupo", type: "two_point" as const, min: 0, max: 0, minAge: 0, maxAge: 120 },
    ]
    onChange({
      ...value,
      type: "group",
      groups: updatedGroups,
    })
  }

  const removeGroup = (index: number) => {
    if (!value?.groups) return
    const updatedGroups = value.groups.filter((_, i) => i !== index)
    onChange({
      ...value,
      type: "group",
      groups: updatedGroups,
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
          Modelo de Valores de Referencia
        </label>
        <select
          value={currentType}
          onChange={(e) => handleTypeChange(e.target.value as any)}
          className="w-full rounded-xl border border-white/10 bg-surface-900 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="sinRef">Sin Val. Ref.</option>
          <option value="single_point">Un Punto (Ej: Hasta 5)</option>
          <option value="two_point">Dos Puntos (Ej: Desde 2 Hasta 5)</option>
          <option value="group">Por Grupo (Ej: Adultos, Niños, Hombres, Mujeres)</option>
        </select>
      </div>

      {currentType === "sinRef" && (
        <div className="py-2 text-xs text-white/40 italic">
          No se configurarán valores de referencia para esta columna.
        </div>
      )}

      {currentType === "single_point" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Hasta *</label>
          <input
            type="number"
            step="any"
            value={value?.max ?? ""}
            onChange={(e) => handleFieldChange("max", e.target.value === "" ? 0 : Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-surface-900 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Ej. 5"
          />
        </div>
      )}

      {currentType === "two_point" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Desde *</label>
            <input
              type="number"
              step="any"
              value={value?.min ?? ""}
              onChange={(e) => handleFieldChange("min", e.target.value === "" ? 0 : Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-surface-900 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Ej. 2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Hasta *</label>
            <input
              type="number"
              step="any"
              value={value?.max ?? ""}
              onChange={(e) => handleFieldChange("max", e.target.value === "" ? 0 : Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-surface-900 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Ej. 5"
            />
          </div>
        </div>
      )}

      {currentType === "group" && (
        <div className="space-y-4">
          {value?.groups?.map((group, index) => (
            <div key={index} className="relative rounded-xl border border-white/5 bg-white/5 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => handleGroupChange(index, "name", e.target.value)}
                  className="rounded-lg border border-white/10 bg-surface-900 px-2.5 py-1 text-sm font-semibold text-white focus:border-primary-500 focus:outline-none focus:ring-1"
                  placeholder="Nombre del Grupo"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(index)}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* ── NUEVA SECCIÓN: TRÁMITE ETARIO DEL GRUPO (EDADES) ── */}
              <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-2">
                <div>
                  <label className="mb-1 block text-[10px] text-white/40">Edad Mínima (Años)</label>
                  <input
                    type="number"
                    min={0}
                    value={group.minAge ?? ""}
                    onChange={(e) => handleGroupChange(index, "minAge", e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-surface-900 px-2 py-1 text-xs text-white"
                    placeholder="Ej. 0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-white/40">Edad Máxima (Años)</label>
                  <input
                    type="number"
                    min={0}
                    value={group.maxAge ?? ""}
                    onChange={(e) => handleGroupChange(index, "maxAge", e.target.value === "" ? 120 : Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-surface-900 px-2 py-1 text-xs text-white"
                    placeholder="Ej. 12"
                  />
                </div>
              </div>

              {/* Rangos del Modelo Clínico */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-white/5 pt-2">
                <div>
                  <label className="mb-1 block text-xs text-white/60">Modelo</label>
                  <select
                    value={group.type}
                    onChange={(e) => handleGroupChange(index, "type", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-surface-900 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="single_point">Un Punto</option>
                    <option value="two_point">Dos Puntos</option>
                  </select>
                </div>

                {group.type === "two_point" ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs text-white/60">Desde</label>
                      <input
                        type="number"
                        step="any"
                        value={group.min ?? ""}
                        onChange={(e) => handleGroupChange(index, "min", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-surface-900 px-2 py-1 text-xs text-white"
                        placeholder="Min"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-white/60">Hasta</label>
                      <input
                        type="number"
                        step="any"
                        value={group.max ?? ""}
                        onChange={(e) => handleGroupChange(index, "max", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-surface-900 px-2 py-1 text-xs text-white"
                        placeholder="Max"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-white/60">Hasta</label>
                    <input
                      type="number"
                      step="any"
                      value={group.max ?? ""}
                      onChange={(e) => handleGroupChange(index, "max", e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-surface-900 px-2 py-1 text-xs text-white"
                      placeholder="Max"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addGroup}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
          >
            <Plus className="h-4 w-4" />
            Agregar Grupo de Referencia
          </button>
        </div>
      )}
    </div>
  )
}