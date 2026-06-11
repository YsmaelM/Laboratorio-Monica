import { useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"
import { useCatalogMutation } from "../hooks/useCatalogMutation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const catalogSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code: z.string().min(1, "El código es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  format: z.enum(["simple", "hematology", "urinalysis", "stool", "culture"]),
  isQuickAction: z.boolean(),
  order: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
})

type CatalogFormValues = z.infer<typeof catalogSchema>

interface CatalogFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: TestCatalogItem
  onSuccess: () => void
}

export default function CatalogFormModal({ isOpen, onClose, initialData, onSuccess }: CatalogFormModalProps) {
  const { addCatalogItem, updateCatalogItem, loading, error: mutationError } = useCatalogMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      format: "simple",
      isQuickAction: false,
      order: 1,
    }
  })

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name)
      setValue("code", initialData.code)
      setValue("category", initialData.category)
      setValue("format", initialData.format)
      setValue("isQuickAction", initialData.isQuickAction)
      setValue("order", initialData.order)
    } else {
      reset({
        name: "",
        code: "",
        category: "",
        format: "simple",
        isQuickAction: false,
        order: 1,
      })
    }
  }, [initialData, isOpen, reset, setValue])

  if (!isOpen) return null

  const onSubmit = async (data: CatalogFormValues) => {
    const itemData = {
      ...data,
      active: true,
      ...(initialData?.simpleDefaults ? { simpleDefaults: initialData.simpleDefaults } : {}),
      ...(initialData?.profileTemplate ? { profileTemplate: initialData.profileTemplate } : {}),
    }

    let success = false
    if (initialData) {
      success = await updateCatalogItem(initialData.id, itemData)
    } else {
      const res = await addCatalogItem(itemData as any)
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
          <form id="catalog-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Nombre de la Prueba *</label>
              <input
                type="text"
                {...register("name")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.name ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Código *</label>
              <input
                type="text"
                {...register("code")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.code ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.code && <p className="mt-1 text-xs text-red-400">{errors.code.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Categoría *</label>
              <input
                type="text"
                {...register("category")}
                placeholder="Ej. Química, Hematología"
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.category ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Formato *</label>
              <select
                {...register("format")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.format ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              >
                <option value="simple" className="bg-surface-900">Simple (1 resultado)</option>
                <option value="hematology" className="bg-surface-900">Hematología</option>
                <option value="urinalysis" className="bg-surface-900">Uroanálisis</option>
                <option value="stool" className="bg-surface-900">Coprológico</option>
                <option value="culture" className="bg-surface-900">Cultivo</option>
              </select>
              {errors.format && <p className="mt-1 text-xs text-red-400">{errors.format.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Orden (prioridad)</label>
              <input
                type="number"
                {...register("order")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.order ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.order && <p className="mt-1 text-xs text-red-400">{errors.order.message}</p>}
            </div>

            <div className="sm:col-span-2 mt-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="isQuickAction"
                {...register("isQuickAction")}
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500 focus:ring-offset-surface-900"
              />
              <label htmlFor="isQuickAction" className="text-sm font-medium text-white/80">
                Mostrar como "Acción Rápida" (Botón grande)
              </label>
            </div>

            {initialData && (
               <div className="sm:col-span-2 mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-400">
                 Nota: Para editar rangos de referencia y plantillas de pruebas complejas, usaremos un editor avanzado en una próxima actualización.
               </div>
            )}
          </form>

          {mutationError && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {mutationError}
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
