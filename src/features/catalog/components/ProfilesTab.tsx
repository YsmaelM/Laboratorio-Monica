import { useState } from "react"
import { Layout, Plus, Pencil, Trash2, X, Save, Search, CheckCircle2, ChevronRight } from "lucide-react"
import type { TestCatalogItem, ProfileTemplate, ProfileSection, ProfileField } from "@/shared/types"
import { useCatalogMutation } from "../hooks/useCatalogMutation"
import toast from "react-hot-toast"

interface ProfilesTabProps {
  items: TestCatalogItem[] // El catálogo completo de exámenes simples/custom
  onRefresh: () => void
}

interface ProfileModalState {
  mode: "create" | "edit"
  item?: TestCatalogItem       // Item de catálogo tipo perfil
  name: string
  selectedFields: ProfileField[] // Campos/exámenes agregados al perfil
}

export default function ProfilesTab({ items, onRefresh }: ProfilesTabProps) {
  const { addCatalogItem, updateCatalogItem } = useCatalogMutation()
  const [modal, setModal] = useState<ProfileModalState | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar el catálogo para mostrar solo los elementos que son de formato "profile" o "Perfil"
  const profileItems = items.filter(i => i.format === "profile" || i.category === "Perfiles")

  // Filtrar exámenes disponibles del catálogo (que no sean perfiles) para agregarlos como campos
  const availableTests = items.filter(i =>
    i.format !== "profile" &&
    i.active &&
    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openCreate = () => {
    setModal({
      mode: "create",
      name: "",
      selectedFields: [],
    })
    setSearchTerm("")
  }

  const openEdit = (item: TestCatalogItem) => {
    // Aplanamos los campos existentes de sus secciones para la edición local
    const fields = item.profileTemplate?.sections.flatMap(s => s.fields) || []
    setModal({
      mode: "edit",
      item,
      name: item.name,
      selectedFields: fields,
    })
    setSearchTerm("")
  }

  const handleDelete = async (item: TestCatalogItem) => {
    if (!confirm(`¿Eliminar el perfil "${item.name}"?`)) return
    await updateCatalogItem(item.id, { active: false })
    toast.success("Perfil desactivado correctamente")
    onRefresh()
  }

  const toggleFieldSelection = (test: TestCatalogItem) => {
    if (!modal) return

    const exists = modal.selectedFields.some(f => f.key === test.id)
    let updatedFields = [...modal.selectedFields]

    if (exists) {
      updatedFields = updatedFields.filter(f => f.key !== test.id)
    } else {
      // Mapeamos el item del catálogo a la interfaz ProfileField estructurada
      updatedFields.push({
        key: test.id,
        label: test.name,
        inputType: test.format === "custom" ? "text" : "number", // Adaptación de entrada
        unit: test.simpleDefaults?.unit || "",
        refValue: test.simpleDefaults?.refValue || undefined,
        defaultValue: ""
      })
    }

    setModal({ ...modal, selectedFields: updatedFields })
  }

  const handleSave = async () => {
    if (!modal) return

    const trimmedName = modal.name.trim()
    if (!trimmedName) {
      toast.error("El nombre del perfil es requerido.")
      return
    }
    if (modal.selectedFields.length === 0) {
      toast.error("Debes seleccionar al menos un examen para conformar el perfil.")
      return
    }

    // Estructuramos los campos dentro de una sección general del PerfilTemplate
    const profileTemplate: ProfileTemplate = {
      sections: [
        {
          sectionName: "Componentes del Perfil",
          fields: modal.selectedFields
        }
      ]
    }

    if (modal.mode === "edit" && modal.item) {
      const ok = await updateCatalogItem(modal.item.id, {
        name: trimmedName,
        profileTemplate,
      })
      if (ok) {
        toast.success("Perfil actualizado con éxito")
        setModal(null)
        onRefresh()
      } else {
        toast.error("Error al guardar el perfil.")
      }
    } else {
      const res = await addCatalogItem({
        name: trimmedName,
        code: trimmedName.toLowerCase().replace(/\s+/g, "_"),
        format: "profile", // Cambiado a profile según tus firmas tipadas
        category: "Perfiles",
        isQuickAction: true,
        order: 50,
        active: true,
        profileTemplate,
      })
      if (res) {
        toast.success("Perfil creado con éxito")
        setModal(null)
        onRefresh()
      } else {
        toast.error("Error al crear el Perfil.")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Vista Principal: Lista de Perfiles ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Layout className="h-5 w-5 text-primary-400" />
            Perfiles Prediseñados
          </h2>
          <p className="mt-0.5 text-sm text-white/50">
            Une múltiples exámenes simples o customizados bajo un solo paquete.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo Perfil
        </button>
      </div>

      {profileItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600/10 text-primary-400">
            <Layout className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white/80">Sin perfiles configurados</h3>
          <p className="mb-6 max-w-sm text-sm text-white/40">Combina exámenes de tu catálogo para agilizar la asignación de órdenes.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profileItems.map(item => {
            const fieldCount = item.profileTemplate?.sections[0]?.fields.length || 0
            return (
              <div key={item.id} className="flex flex-col rounded-2xl border border-white/10 bg-surface-900 p-5 transition hover:border-white/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-white/40">{item.code}</p>
                  </div>
                  <span className="rounded-full border border-primary-500/20 bg-primary-500/5 px-2.5 py-0.5 text-[11px] font-medium text-primary-400">
                    {fieldCount} Pruebas
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5 transition"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="ml-auto flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-400/60 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Avanzado: Constructor de Perfiles por Selección ────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {modal.mode === "create" ? "Crear Nuevo Perfil" : `Editar Perfil: ${modal.name}`}
              </h3>
              <button onClick={() => setModal(null)} className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Configuración del Nombre */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-white/60">Nombre del Perfil *</label>
              <input
                type="text"
                value={modal.name}
                onChange={e => setModal({ ...modal, name: e.target.value })}
                placeholder="Ej. Perfil Lipídico, Perfil Hepático"
                className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Grilla Divisoria (Catálogo vs Seleccionados) */}
            <div className="grid gap-6 md:grid-cols-2 flex-1 overflow-hidden min-h-0">

              {/* Columna Izquierda: Buscador y Catálogo de Pruebas */}
              <div className="flex flex-col border border-white/5 rounded-xl bg-white/[0.01] p-4 overflow-hidden">
                <div className="mb-3 flex items-center rounded-lg border border-white/10 bg-surface-950/40 px-3 py-1.5">
                  <Search className="h-4 w-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Filtrar catálogo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="ml-2 w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/30 block mb-1">Exámenes Disponibles</span>
                  {availableTests.map(test => {
                    const isSelected = modal.selectedFields.some(f => f.key === test.id)
                    return (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => toggleFieldSelection(test)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${isSelected
                          ? "border-primary-500/40 bg-primary-500/10 text-white"
                          : "border-white/5 bg-white/[0.02] text-white/70 hover:bg-white/5"
                          }`}
                      >
                        <div>
                          <p className="text-xs font-semibold">{test.name}</p>
                          <p className="text-[10px] text-white/40 capitalize">{test.category} · {test.format}</p>
                        </div>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-primary-400 bg-primary-500 text-white" : "border-white/20"
                          }`}>
                          {isSelected ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3 text-white/40" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Columna Derecha: Lista de Pruebas Agrupadas en este Perfil */}
              <div className="flex flex-col border border-white/5 rounded-xl bg-white/[0.01] p-4 overflow-hidden">
                <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/30">Pruebas en este Perfil ({modal.selectedFields.length})</span>
                </div>

                {modal.selectedFields.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center text-white/30 italic text-xs">
                    No has añadido exámenes a este combo todavía.
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {modal.selectedFields.map((field) => (
                      <div key={field.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-950/40 p-3">
                        <div>
                          <p className="text-xs font-semibold text-white/90">{field.label}</p>
                          <p className="text-[10px] text-white/40">
                            {field.unit || "Sin unidad"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModal({ ...modal, selectedFields: modal.selectedFields.filter(f => f.key !== field.key) })}
                          className="rounded-lg p-1 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción del Modal */}
            <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2 text-xs font-medium text-white shadow-lg transition hover:bg-primary-500"
              >
                <Save className="h-3.5 w-3.5" />
                Guardar Combo Perfil
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
