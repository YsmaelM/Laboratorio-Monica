import { useState } from "react"
import { Layout, Plus, Pencil, Copy, Trash2, Loader2, CheckCircle2, X, Save } from "lucide-react"
import type { TestCatalogItem, CustomFormatTemplate } from "@/shared/types"
import { useCatalogMutation } from "../hooks/useCatalogMutation"
import FormatBuilder from "./FormatBuilder"

interface FormatsTabProps {
  items: TestCatalogItem[]
  onRefresh: () => void
}

const EMPTY_TEMPLATE: CustomFormatTemplate = { rows: [] }

interface FormatModalState {
  mode: "create" | "edit"
  item?: TestCatalogItem          // for edit
  name: string
  template: CustomFormatTemplate
}

export default function FormatsTab({ items, onRefresh }: FormatsTabProps) {
  const { addCatalogItem, updateCatalogItem, loading } = useCatalogMutation()
  const [modal, setModal] = useState<FormatModalState | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Only custom-format items
  const customItems = items.filter(i => i.format === "custom" && i.active)

  const openCreate = () => {
    setModal({
      mode: "create",
      name: "",
      template: EMPTY_TEMPLATE,
    })
    setSavedId(null)
    setError(null)
  }

  const openEdit = (item: TestCatalogItem) => {
    setModal({
      mode: "edit",
      item,
      name: item.name,
      template: item.customTemplate ?? EMPTY_TEMPLATE,
    })
    setSavedId(null)
    setError(null)
  }

  const openDuplicate = (item: TestCatalogItem) => {
    setModal({
      mode: "create",
      name: `${item.name} (copia)`,
      template: item.customTemplate ?? EMPTY_TEMPLATE,
    })
    setSavedId(null)
    setError(null)
  }

  const handleDelete = async (item: TestCatalogItem) => {
    if (!confirm(`¿Eliminar el formato "${item.name}"?`)) return
    await updateCatalogItem(item.id, { active: false })
    onRefresh()
  }

  const handleSave = async () => {
    if (!modal) return
    setError(null)

    const trimmed = modal.name.trim()
    if (!trimmed) {
      setError("El nombre del formato es requerido.")
      return
    }
    if (modal.template.rows.length === 0) {
      setError("El formato debe tener al menos una fila.")
      return
    }

    if (modal.mode === "edit" && modal.item) {
      const ok = await updateCatalogItem(modal.item.id, {
        name: trimmed,
        customTemplate: modal.template,
      })
      if (ok) {
        setSavedId(modal.item.id)
        onRefresh()
      } else {
        setError("Error al guardar el formato.")
      }
    } else {
      const res = await addCatalogItem({
        name: trimmed,
        code: trimmed.toLowerCase().replace(/\s+/g, "_"),
        format: "custom",
        category: "Custom",
        isQuickAction: false,
        order: 99,
        active: true,
        customTemplate: modal.template,
      })
      if (res) {
        setSavedId(res.id)
        onRefresh()
      } else {
        setError("Error al crear el formato.")
      }
    }
  }

  return (
    <>
      {/* ── List view ─────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Layout className="h-5 w-5 text-primary-400" />
              Formatos Custom
            </h2>
            <p className="mt-0.5 text-sm text-white/50">
              Diseña estructuras de reporte personalizadas con filas, membretes y columnas configurables.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" />
            Nuevo Formato
          </button>
        </div>

        {/* Empty state */}
        {customItems.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-600/10 text-primary-400">
              <Layout className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-white/80">
              Sin formatos custom aún
            </h3>
            <p className="mb-6 max-w-sm text-sm text-white/40">
              Crea tu primer formato para diseñar reportes estructurados con secciones y columnas a tu medida.
            </p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-500"
            >
              <Plus className="h-4 w-4" />
              Crear Primer Formato
            </button>
          </div>
        )}

        {/* Format cards grid */}
        {customItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customItems.map(item => {
              const rowCount = item.customTemplate?.rows.length ?? 0
              const testRows  = item.customTemplate?.rows.filter(r => r.type === "test").length ?? 0
              const headerRows = item.customTemplate?.rows.filter(r => r.type === "header").length ?? 0

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-surface-900 p-5 shadow-card transition hover:border-white/20"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      <p className="mt-0.5 text-xs text-white/40">{item.code}</p>
                    </div>
                    <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-400">
                      Custom
                    </span>
                  </div>

                  {/* Row stats */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
                      {rowCount} fila{rowCount !== 1 ? "s" : ""}
                    </span>
                    {testRows > 0 && (
                      <span className="rounded-lg border border-primary-500/20 bg-primary-500/5 px-2.5 py-1 text-xs text-primary-400">
                        {testRows} prueba{testRows !== 1 ? "s" : ""}
                      </span>
                    )}
                    {headerRows > 0 && (
                      <span className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1 text-xs text-yellow-400">
                        {headerRows} membrete{headerRows !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Mini preview of columns */}
                  {item.customTemplate && item.customTemplate.rows.filter(r => r.type === "test").slice(0, 1).map(row => {
                    if (row.type !== "test") return null
                    return (
                      <div key={row.id} className="mb-4 flex flex-wrap gap-1">
                        {row.columns.slice(0, 6).map(col => (
                          <span
                            key={col.id}
                            className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50 truncate max-w-[80px]"
                            title={col.label}
                          >
                            {col.label || "Sin nombre"}
                          </span>
                        ))}
                        {row.columns.length > 6 && (
                          <span className="text-[10px] text-white/30">+{row.columns.length - 6}</span>
                        )}
                      </div>
                    )
                  })}

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => openDuplicate(item)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicar
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="ml-auto flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Builder Modal ──────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-surface-950/80 backdrop-blur-sm overflow-y-auto p-4">
          <div className="relative my-8 w-full max-w-5xl rounded-2xl border border-white/10 bg-surface-900 shadow-2xl flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">
                {modal.mode === "create" ? "Crear Nuevo Formato" : `Editar: ${modal.item?.name}`}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Format name input */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/80">
                  Nombre del Formato *
                </label>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => setModal(m => m ? { ...m, name: e.target.value } : null)}
                  placeholder="Ej: Coprológico, Hemograma completo..."
                  className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Format Builder */}
              <div>
                <label className="mb-3 block text-sm font-medium text-white/80">
                  Estructura del Formato
                </label>
                <FormatBuilder
                  value={modal.template}
                  onChange={(tpl) => setModal(m => m ? { ...m, template: tpl } : null)}
                  formatName={modal.name}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Saved confirmation */}
              {savedId && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Formato guardado correctamente.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 border-t border-white/10 bg-surface-900/50 px-6 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={loading}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                {savedId ? "Cerrar" : "Cancelar"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? "Guardando..." : "Guardar Formato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
