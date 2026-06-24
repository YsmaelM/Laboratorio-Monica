import { Edit2, AlertCircle } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"
import { migrateRefRange } from "../utils/migrateRefRanges"

interface ReferenceValuesTabProps {
  items: TestCatalogItem[]
  onEdit: (item: TestCatalogItem) => void
}

export default function ReferenceValuesTab({ items, onEdit }: ReferenceValuesTabProps) {
  // Filter for simple format items since only they have simple reference values here
  const simpleItems = items.filter((item) => item.format === "simple")

  const renderRefValueSummary = (item: TestCatalogItem) => {
    const ref = item.simpleDefaults?.refValue || migrateRefRange(item.simpleDefaults?.refRanges)
    if (!ref) return <span className="text-white/40">No configurado</span>

    if (ref.type === "single_point") {
      return <span>Hasta: <strong className="text-primary-400">{ref.max}</strong></span>
    }

    if (ref.type === "two_point") {
      return (
        <span>
          Desde <strong className="text-primary-400">{ref.min}</strong> Hasta <strong className="text-primary-400">{ref.max}</strong>
        </span>
      )
    }

    if (ref.type === "group") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {ref.groups?.map((g, idx) => (
            <span key={idx} className="inline-flex items-center rounded-lg bg-white/5 px-2 py-0.5 text-xs border border-white/5">
              <span className="text-white/60 mr-1">{g.name}:</span>
              {g.type === "two_point" ? (
                <strong className="text-primary-400">{g.min} - {g.max}</strong>
              ) : (
                <span>Hasta <strong className="text-primary-400">{g.max}</strong></span>
              )}
            </span>
          ))}
        </div>
      )
    }

    return <span className="text-white/40">N/A</span>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface-900 shadow-xl">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-white/10 bg-white/5 text-white">
          <tr>
            <th className="px-6 py-4 font-medium">Código</th>
            <th className="px-6 py-4 font-medium">Nombre de la Prueba</th>
            <th className="px-6 py-4 font-medium">Unidad</th>
            <th className="px-6 py-4 font-medium">Método</th>
            <th className="px-6 py-4 font-medium">Valor de Referencia</th>
            <th className="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {simpleItems.map((item) => (
            <tr key={item.id} className="transition hover:bg-white/5">
              <td className="whitespace-nowrap px-6 py-4 font-mono text-white/60">{item.code}</td>
              <td className="px-6 py-4 font-medium">{item.name}</td>
              <td className="px-6 py-4">{item.simpleDefaults?.unit || <span className="text-white/30">—</span>}</td>
              <td className="px-6 py-4">{item.simpleDefaults?.method || <span className="text-white/30">—</span>}</td>
              <td className="px-6 py-4">{renderRefValueSummary(item)}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(item)}
                  className="rounded-lg p-2 text-white/40 hover:bg-primary-500/10 hover:text-primary-400"
                  title="Editar Valores de Referencia"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {simpleItems.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-white/50">
                <div className="flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5 text-white/30" />
                  <span>No hay pruebas simples en el catálogo.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
