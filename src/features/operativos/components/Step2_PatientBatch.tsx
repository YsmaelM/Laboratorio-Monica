import { useState } from "react"
import type { Patient, TestEntry, BatchEntry } from "@/shared/types"
import PatientSearchInput from "@/features/patients/components/PatientSearchInput"
import QuickBatchRegister from "./QuickBatchRegister"
import BulkResultApplier from "./BulkResultApplier"
import PatientResultRow from "./PatientResultRow"
import ResultEditModal from "./ResultEditModal"
import { Search, Plus } from "lucide-react"

interface Step2PatientBatchProps {
  templateTests: TestEntry[]
  patients: BatchEntry[]
  paginatedPatients: BatchEntry[]
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  totalCount: number
  completedCount: number
  addPatient: (patient: Patient) => void
  addBatchPatients: (newPatients: Patient[], withResult: boolean, resultTests: TestEntry[]) => void
  removePatient: (id: string) => void
  updatePatientTests: (id: string, tests: TestEntry[]) => void
  applyResultToAll: (tests: TestEntry[]) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2PatientBatch({
  templateTests,
  patients,
  paginatedPatients,
  currentPage,
  setCurrentPage,
  totalPages,
  totalCount,
  completedCount,
  addPatient,
  addBatchPatients,
  removePatient,
  updatePatientTests,
  applyResultToAll,
  onNext,
  onBack,
}: Step2PatientBatchProps) {
  const [nationalIdQuery, setNationalIdQuery] = useState("")
  const [showQuickRegister, setShowQuickRegister] = useState(false)
  const [activeModalEntry, setActiveModalEntry] = useState<BatchEntry | null>(null)

  const handlePatientFound = (patient: Patient) => {
    addPatient(patient)
    setNationalIdQuery("")
  }

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Ingreso de Pacientes y Resultados</h2>
          <p className="text-sm text-white/60">
            Busca y agrega pacientes a la lista. Ingresa sus resultados de forma inline o masiva.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5"
          >
            Atrás
          </button>
          <button
            onClick={onNext}
            disabled={totalCount === 0 || completedCount < totalCount}
            className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-glow-primary hover:bg-primary-500 disabled:opacity-50"
          >
            Siguiente: Generar Reportes ({completedCount}/{totalCount})
          </button>
        </div>
      </div>

      {/* Buscador de pacientes e integración de registro rápido */}
      <div className="grid gap-4 md:grid-cols-4 items-end">
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-white/60 mb-1.5">Buscar Paciente por Cédula</label>
          <PatientSearchInput
            onPatientFound={(p) => {
              if (p) handlePatientFound(p)
            }}
            onRegisterNew={(nationalId) => {
              // Cargar ID de registro en búsqueda y abrir modal
              setShowQuickRegister(true)
            }}
          />
        </div>
        <div>
          <button
            onClick={() => setShowQuickRegister(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white/80 hover:border-white/40 hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Registro Rápido
          </button>
        </div>
      </div>

      {/* Aplicador masivo de resultados */}
      <BulkResultApplier templateTests={templateTests} onApply={applyResultToAll} />

      {/* Tabla de Pacientes */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white">
            <thead className="border-b border-white/10 bg-white/5 text-xs font-semibold text-white/60">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Resultados</th>
                <th className="px-4 py-3 text-center w-28">Estado</th>
                <th className="px-4 py-3 text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/40">
                    No has agregado pacientes a este operativo.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((entry, idx) => {
                  const globalIndex = (currentPage - 1) * 20 + idx + 1
                  return (
                    <PatientResultRow
                      key={entry.patientId}
                      index={globalIndex}
                      entry={entry}
                      onRemove={() => removePatient(entry.patientId)}
                      onUpdateTests={(tests) => updatePatientTests(entry.patientId, tests)}
                      onOpenEditModal={() => setActiveModalEntry(entry)}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-white/40">
            Pág. {currentPage} de {totalPages} ({totalCount} pacientes en total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modales de soporte */}
      {showQuickRegister && (
        <QuickBatchRegister
          templateTests={templateTests}
          onClose={() => setShowQuickRegister(false)}
          onPatientsRegistered={(registeredList, applyResult, resultTests) => {
            addBatchPatients(registeredList, applyResult, resultTests)
            setShowQuickRegister(false)
          }}
        />
      )}

      {activeModalEntry && (
        <ResultEditModal
          entry={activeModalEntry}
          isOpen={!!activeModalEntry}
          onClose={() => setActiveModalEntry(null)}
          onSave={(tests) => {
            updatePatientTests(activeModalEntry.patientId, tests)
          }}
        />
      )}
    </div>
  )
}
