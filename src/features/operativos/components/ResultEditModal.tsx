import { useState } from "react"
import { X } from "lucide-react"
import type { BatchEntry, TestEntry } from "@/shared/types"
import EntryFormFactory from "@/features/orders/components/entry-forms/EntryFormFactory"

interface ResultEditModalProps {
  entry: BatchEntry
  isOpen: boolean
  onClose: () => void
  onSave: (tests: TestEntry[]) => void
}

export default function ResultEditModal({ entry, isOpen, onClose, onSave }: ResultEditModalProps) {
  // Estado local para no llamar onSave (que cierra el modal) en cada cambio
  const [localTests, setLocalTests] = useState<TestEntry[]>(entry.tests)

  if (!isOpen) return null

  const handleDone = () => {
    onSave(localTests)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-white">
            Resultados de {entry.patient.firstName} {entry.patient.lastName}
          </h3>
          <p className="text-xs text-white/40">Cédula: {entry.patient.nationalId}</p>
        </div>

        <div className="space-y-4">
          {localTests.map((testEntry, idx) => (
            <div key={testEntry.catalogId} className="rounded-xl border border-white/10 bg-surface-950 p-4">
              <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">
                {testEntry.testName} ({testEntry.format})
              </h4>
              <EntryFormFactory
                entry={testEntry}
                onChange={(updated) => {
                  const updatedTests = [...localTests]
                  updatedTests[idx] = updated
                  setLocalTests(updatedTests)
                }}
                patient={entry.patient}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-6 py-2 text-sm font-medium text-white/70 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={handleDone}
            className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-glow-primary hover:bg-primary-500"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

