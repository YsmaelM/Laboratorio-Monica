import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { X, Loader2 } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"
import { useCatalogMutation } from "../hooks/useCatalogMutation"

interface CatalogFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: TestCatalogItem
  onSuccess: () => void
}

export default function CatalogFormModal({ isOpen, onClose, initialData, onSuccess }: CatalogFormModalProps) {
  const { addCatalogItem, updateCatalogItem, loading, error } = useCatalogMutation()

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState("")
  const [format, setFormat] = useState<TestCatalogItem["format"]>("simple")
  const [isQuickAction, setIsQuickAction] = useState(false)
  const [order, setOrder] = useState(1)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setCode(initialData.code)
      setCategory(initialData.category)
      setFormat(initialData.format)
      setIsQuickAction(initialData.isQuickAction)
      setOrder(initialData.order)
    } else {
      setName("")
      setCode("")
      setCategory("")
      setFormat("simple")
      setIsQuickAction(false)
      setOrder(1)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const itemData = {
      name,
      code,
      category,
      format,
      isQuickAction,
      order,
      active: true,
      // For now we keep existing template/defaults if editing, or empty if new.
      // A full editor would handle simpleDefaults and profileTemplate here.
      ...(initialData?.simpleDefaults ? { simpleDefaults: initialData.simpleDefaults } : {}),
      ...(initialData?.profileTemplate ? { profileTemplate: initialData.profileTemplate } : {}),
    }

    let success = false
    if (initialData) {
      success = await updateCatalogItem(initialData.id, itemData)
    } else {
      const res = await addCatalogItem(itemData)
      success = !!res
    }

    if (success) {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl animate-slide-up rounded-2xl border border-white/10 bg-surface-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? "Editar Prueba" : "Nueva Prueba"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="catalog-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Nombre de la Prueba *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Código *</label>
              <input
                required
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Categoría *</label>
              <input
                required
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej. Química, Hematología"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Formato *</label>
              <select
                required
                value={format}
                onChange={(e) => setFormat(e.target.value as TestCatalogItem["format"])}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="simple" className="bg-surface-900">Simple (1 resultado)</option>
                <option value="hematology" className="bg-surface-900">Hematología</option>
                <option value="urinalysis" className="bg-surface-900">Uroanálisis</option>
                <option value="stool" className="bg-surface-900">Coprológico</option>
                <option value="culture" className="bg-surface-900">Cultivo</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Orden (prioridad)</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="sm:col-span-2 mt-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="isQuickAction"
                checked={isQuickAction}
                onChange={(e) => setIsQuickAction(e.target.checked)}
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500 focus:ring-offset-surface-900"
              />
              <label htmlFor="isQuickAction" className="text-sm font-medium text-white/80">
                Mostrar como "Acción Rápida" (Botón grande)
              </label>
            </div>

            {/* Note: In a full implementation, the ProfileTemplateEditor / RefRangeEditor would go here */}
            {initialData && (
               <div className="sm:col-span-2 mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-400">
                 Nota: Para editar rangos de referencia y plantillas de pruebas complejas, usaremos un editor avanzado en una próxima actualización.
               </div>
            )}
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-surface-900/50 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="catalog-form"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Guardando..." : "Guardar Prueba"}
          </button>
        </div>
      </div>
    </div>
  )
}
