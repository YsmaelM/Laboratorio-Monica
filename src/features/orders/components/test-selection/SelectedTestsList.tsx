import type { TestEntry } from "@/shared/types"
import { X, CheckCircle2 } from "lucide-react"

interface SelectedTestsListProps {
  selectedTests: TestEntry[]
  onRemove: (catalogId: string) => void
}

export default function SelectedTestsList({ selectedTests, onRemove }: SelectedTestsListProps) {
  if (selectedTests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
        <p className="text-white/60">No has seleccionado ninguna prueba aún.</p>
        <p className="mt-1 text-sm text-white/40">Usa las acciones rápidas o el buscador de arriba.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-white/60">Pruebas Seleccionadas ({selectedTests.length})</h3>
      <div className="grid gap-3">
        {selectedTests.map(entry => (
          <div
            key={entry.catalogId}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-800 p-4 transition hover:bg-surface-800/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-white">{entry.testName}</div>
                <div className="text-xs capitalize text-white/50">{entry.format}</div>
              </div>
            </div>
            
            <button
              onClick={() => onRemove(entry.catalogId)}
              className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
              title="Eliminar prueba"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
