import { useState } from "react"
import { Plus, Beaker, FileSpreadsheet, Scale, Layers } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"
import { useTestCatalog } from "@/features/orders/hooks/useTestCatalog"
import { useCatalogMutation } from "../hooks/useCatalogMutation"
import CatalogTable from "../components/CatalogTable"
import CatalogFormModal from "../components/CatalogFormModal"
import ReferenceValuesTab from "../components/ReferenceValuesTab"
import FormatsTab from "../components/FormatsTab"

export default function CatalogManagementPage() {
  const { catalog, loading, error } = useTestCatalog()
  const { deleteCatalogItem } = useCatalogMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TestCatalogItem | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<"tests" | "reference_values" | "formats">("tests")

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
    window.location.reload()
  }

  const handleSuccess = () => {
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Beaker className="h-6 w-6 text-primary-400" />
            Catálogo del Laboratorio
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Administra las pruebas, perfiles, rangos de referencia, unidades y formatos de reporte.
          </p>
        </div>
        
        {activeTab === "tests" && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" />
            Nueva Prueba
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="mb-6 flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("tests")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "tests"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-white/60 hover:text-white hover:border-white/10"
          }`}
        >
          <Layers className="h-4 w-4" />
          Pruebas
        </button>
        <button
          onClick={() => setActiveTab("reference_values")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "reference_values"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-white/60 hover:text-white hover:border-white/10"
          }`}
        >
          <Scale className="h-4 w-4" />
          Valores de Referencia
        </button>
        <button
          onClick={() => setActiveTab("formats")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "formats"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-white/60 hover:text-white hover:border-white/10"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Formatos
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
        <div>
          {activeTab === "tests" && (
            <CatalogTable
              items={catalog}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {activeTab === "reference_values" && (
            <ReferenceValuesTab
              items={catalog}
              onEdit={handleEdit}
            />
          )}

          {activeTab === "formats" && (
            <FormatsTab />
          )}
        </div>
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
