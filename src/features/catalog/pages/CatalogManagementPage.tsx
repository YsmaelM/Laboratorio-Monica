import { useState } from "react"
import { Plus, Beaker } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"
import { useTestCatalog } from "@/features/orders/hooks/useTestCatalog"
import { useCatalogMutation } from "../hooks/useCatalogMutation"
import CatalogTable from "../components/CatalogTable"
import CatalogFormModal from "../components/CatalogFormModal"

export default function CatalogManagementPage() {
  const { catalog, loading, error } = useTestCatalog()
  const { deleteCatalogItem } = useCatalogMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TestCatalogItem | undefined>(undefined)

  const handleEdit = (item: TestCatalogItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingItem(undefined)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteCatalogItem(id)
    // Actually we should reload the catalog or rely on a snapshot listener.
    // Since useTestCatalog uses getDocs once on mount, we can force a reload.
    window.location.reload()
  }

  const handleSuccess = () => {
    // Reload catalog after mutation
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Beaker className="h-6 w-6 text-primary-400" />
            Catálogo de Pruebas
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Administra las pruebas, perfiles, rangos de referencia y unidades.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          Nueva Prueba
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-white/50">
          Cargando catálogo...
        </div>
      ) : (
        <CatalogTable
          items={catalog}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <CatalogFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
