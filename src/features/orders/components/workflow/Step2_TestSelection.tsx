
import { Loader2 } from "lucide-react"
import type { TestEntry, TestCatalogItem } from "@/shared/types"
import { useTestCatalog } from "../../hooks/useTestCatalog"
import QuickActionButtons from "../test-selection/QuickActionButtons"
import TestCombobox from "../test-selection/TestCombobox"
import SelectedTestsList from "../test-selection/SelectedTestsList"
import { createTestEntry } from "../../utils/createTestEntry"

interface Step2TestSelectionProps {
  selectedTests: TestEntry[]
  onTestsChange: (tests: TestEntry[]) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2TestSelection({
  selectedTests,
  onTestsChange,
  onNext,
  onBack,
}: Step2TestSelectionProps) {
  const { catalog, loading, error } = useTestCatalog()

  const handleSelect = (catalogItem: TestCatalogItem) => {
    // ── 1. CASO COMPUESTO: SI EL ELEMENTO SELECCIONADO ES UN PERFIL/COMBO ──
    if (catalogItem.format === "profile" && catalogItem.profileTemplate?.sections) {
      let newTests = [...selectedTests];
      let addedCount = 0;

      // Recorremos todas las secciones y campos dentro del perfil prediseñado
      catalogItem.profileTemplate.sections.forEach((section) => {
        section.fields.forEach((field) => {
          // El field.key contiene el ID del examen real en el catálogo (ej: el id de Hemoglobina)
          const childCatalogItem = catalog.find(item => item.id === field.key);

          if (childCatalogItem) {
            // Evitamos duplicar la prueba si el paciente ya la tenía agregada en la orden
            if (!newTests.some(t => t.catalogId === childCatalogItem.id)) {
              const newEntry = createTestEntry(childCatalogItem);
              newTests.push(newEntry);
              addedCount++;
            }
          }
        });
      });

      if (addedCount > 0) {
        onTestsChange(newTests);
      }
      return; // Finalizamos la ejecución para perfiles
    }

    // ── 2. CASO SIMPLE: COMPORTAMIENTO NORMAL PARA EXÁMENES INDIVIDUALES ──
    if (selectedTests.some(t => t.catalogId === catalogItem.id)) {
      return;
    }

    const newEntry = createTestEntry(catalogItem);
    onTestsChange([...selectedTests, newEntry]);
  }

  const handleRemove = (catalogId: string) => {
    onTestsChange(selectedTests.filter(t => t.catalogId !== catalogId))
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
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Selección de Pruebas</h2>
        <p className="text-sm text-white/60">Busca o usa las acciones rápidas para agregar pruebas a la orden.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Selection */}
        <div>
          <QuickActionButtons catalog={catalog} onSelect={handleSelect} />
          <TestCombobox catalog={catalog} onSelect={handleSelect} />
        </div>

        {/* Right Column: Selected Tests */}
        <div>
          <SelectedTestsList selectedTests={selectedTests} onRemove={handleRemove} />
        </div>
      </div>

      <div className="mt-8 flex justify-between border-t border-white/10 pt-6">
        <button
          onClick={onBack}
          className="rounded-xl px-6 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Volver
        </button>
        <button
          onClick={onNext}
          disabled={selectedTests.length === 0}
          className="rounded-xl bg-primary-600 px-8 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500 disabled:opacity-50"
        >
          Siguiente: Ingresar Resultados
        </button>
      </div>
    </div>
  )
}
