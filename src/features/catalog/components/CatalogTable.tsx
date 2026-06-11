import { Edit2, Trash2 } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"

interface CatalogTableProps {
  items: TestCatalogItem[]
  onEdit: (item: TestCatalogItem) => void
  onDelete: (id: string) => void
}

export default function CatalogTable({ items, onEdit, onDelete }: CatalogTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface-900 shadow-xl">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-white/10 bg-white/5 text-white">
          <tr>
            <th className="px-6 py-4 font-medium">Código</th>
            <th className="px-6 py-4 font-medium">Nombre de la Prueba</th>
            <th className="px-6 py-4 font-medium">Formato</th>
            <th className="px-6 py-4 font-medium">Categoría</th>
            <th className="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((item) => (
            <tr key={item.id} className="transition hover:bg-white/5">
              <td className="whitespace-nowrap px-6 py-4 font-mono text-white/60">{item.code}</td>
              <td className="px-6 py-4 font-medium">{item.name}</td>
              <td className="px-6 py-4 capitalize">{item.format}</td>
              <td className="px-6 py-4">{item.category}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="rounded-lg p-2 text-white/40 hover:bg-primary-500/10 hover:text-primary-400"
                    title="Editar Prueba"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("¿Seguro que deseas eliminar esta prueba?")) {
                        onDelete(item.id)
                      }
                    }}
                    className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                    title="Eliminar Prueba"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                No se encontraron pruebas en el catálogo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
