import { Loader2 } from "lucide-react"
import type { TestEntry, TestCatalogItem } from "@/shared/types"
import { useTestCatalog } from "@/features/orders/hooks/useTestCatalog"
import QuickActionButtons from "@/features/orders/components/test-selection/QuickActionButtons"
import TestCombobox from "@/features/orders/components/test-selection/TestCombobox"
import SelectedTestsList from "@/features/orders/components/test-selection/SelectedTestsList"
import { createTestEntry } from "@/features/orders/utils/createTestEntry"

interface Step1TestTemplateProps {
  batchName: string
  onBatchNameChange: (val: string) => void
  referringDoctor: string
  onReferringDoctorChange: (val: string) => void
  selectedTests: TestEntry[]
  onTestsChange: (tests: TestEntry[]) => void
  onNext: () => void
}

export default function Step1TestTemplate({
  batchName,
  onBatchNameChange,
  referringDoctor,
  onReferringDoctorChange,
  selectedTests,
  onTestsChange,
  onNext,
}: Step1TestTemplateProps) {
  const { catalog, loading, error } = useTestCatalog()

  const handleSelect = (catalogItem: TestCatalogItem) => {
    if (catalogItem.format === "profile" && catalogItem.profileTemplate?.sections) {
      let newTests = [...selectedTests]
      let addedCount = 0

      catalogItem.profileTemplate.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const childCatalogItem = catalog.find((item) => item.id === field.key)
          if (childCatalogItem) {
            if (!newTests.some((t) => t.catalogId === childCatalogItem.id)) {
              const newEntry = createTestEntry(childCatalogItem)
              newTests.push(newEntry)
              addedCount++
            }
          }
        })
      })

      if (addedCount > 0) {
        onTestsChange(newTests)
      }
      return
    }

    if (selectedTests.some((t) => t.catalogId === catalogItem.id)) {
      return
    }

    const newEntry = createTestEntry(catalogItem)
    onTestsChange([...selectedTests, newEntry])
  }

  const handleRemove = (catalogId: string) => {
    onTestsChange(selectedTests.filter((t) => t.catalogId !== catalogId))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Cargando catálogo de pruebas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Configuración del Operativo</h2>
        <p className="text-sm text-white/60">Define el nombre del lote, el médico y las pruebas que se aplicarán.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Nombre del Operativo / Empresa</label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => onBatchNameChange(e.target.value)}
            placeholder="Ej: Pre-empleo Corporación XYZ"
            className="w-full rounded-xl border border-white/10 bg-surface-950 px-4 py-2.5 text-sm text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Médico Referente (Opcional)</label>
          <input
            type="text"
            value={referringDoctor}
            onChange={(e) => onReferringDoctorChange(e.target.value)}
            placeholder="Ej: Dr. Alejandro Méndez"
            className="w-full rounded-xl border border-white/10 bg-surface-950 px-4 py-2.5 text-sm text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-lg font-medium text-white mb-4">Pruebas a realizar</h3>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <QuickActionButtons catalog={catalog} onSelect={handleSelect} />
            <TestCombobox catalog={catalog} onSelect={handleSelect} />
          </div>
          <div>
            <SelectedTestsList selectedTests={selectedTests} onRemove={handleRemove} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
        <button
          onClick={onNext}
          disabled={!batchName.trim() || selectedTests.length === 0}
          className="rounded-xl bg-primary-600 px-8 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500 disabled:opacity-50"
        >
          Siguiente: Configurar Pacientes y Resultados
        </button>
      </div>
    </div>
  )
}
