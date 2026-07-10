import { useState } from "react"
import { ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react"
import type { Patient, TestEntry } from "@/shared/types"
import { useOrderMutation } from "../../hooks/useOrderMutation"
import EntryFormFactory from "../entry-forms/EntryFormFactory"

interface Step3DataEntryProps {
  patient: Patient
  tests: TestEntry[]
  orderId?: string | null
  onTestsChange: (tests: TestEntry[]) => void
  onBack: () => void
  onOrderSaved: (orderId: string) => void
}

export function isTestEntryFilled(test: TestEntry): boolean {
  if (test.format === "simple") {
    const val = test.data?.result
    return val !== undefined && val !== null && String(val).trim() !== ""
  }
  if (test.format === "culture") {
    const sampleEmpty = !test.data?.sampleType || String(test.data.sampleType).trim() === ""
    const resultEmpty = !test.data?.cultureResult || String(test.data.cultureResult).trim() === ""
    return !sampleEmpty && !resultEmpty
  }
  if (test.format === "custom") {
    const template = (test as any).customTemplate
    if (!template?.rows) return false
    let hasInputs = false
    let hasEmpty = false
    template.rows.forEach((row: any) => {
      if (row.columns && (row.type === "test" || row.type === "simple")) {
        row.columns.forEach((col: any) => {
          if (
            !col.isHeaderOnly &&
            !col.isFixed &&
            col.type !== "formula" &&
            col.type !== "reference" &&
            col.type !== "unit"
          ) {
            hasInputs = true
            const val = test.data[`${row.id}|${col.id}`]
            if (val === undefined || val === null || String(val).trim() === "") {
              hasEmpty = true
            }
          }
        })
      }
    })
    return hasInputs ? !hasEmpty : false
  }
  return false
}

export function checkIfHasEmptyResults(tests: TestEntry[]): boolean {
  return tests.some((test) => !isTestEntryFilled(test))
}

export default function Step3DataEntry({
  patient,
  tests,
  orderId,
  onTestsChange,
  onBack,
  onOrderSaved,
}: Step3DataEntryProps) {
  const { saveOrder, loading, error } = useOrderMutation()
  const [expandedIdx, setExpandedIdx] = useState<number>(0)
  const [referringDoctor, setReferringDoctor] = useState("")
  const [showWarningModal, setShowWarningModal] = useState(false)

  const handleEntryChange = (idx: number, updated: TestEntry) => {
    const newTests = [...tests]
    newTests[idx] = updated
    onTestsChange(newTests)
  }

  const toggleExpand = (idx: number) => {
    setExpandedIdx(prev => (prev === idx ? -1 : idx))
  }

  const handleSave = async () => {
    if (checkIfHasEmptyResults(tests)) {
      setShowWarningModal(true)
    } else {
      executeSave()
    }
  }

  const executeSave = async () => {
    const savedId = await saveOrder(patient, tests, referringDoctor, orderId || undefined)
    if (savedId) {
      onOrderSaved(savedId)
    }
  }

  const handleNextTest = (currentIdx: number) => {
    if (currentIdx < tests.length - 1) {
      setExpandedIdx(currentIdx + 1) // Cierra el actual y expande el de la siguiente prueba
    } else {
      // Opcional: Si ya terminó la última prueba, podemos cerrar el acordeón actual
      setExpandedIdx(-1)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Ingreso de Resultados</h2>
        <p className="text-sm text-white/60">
          Paciente: <span className="font-medium text-white/80">{patient.firstName} {patient.lastName}</span>
          {" · "}Pruebas: <span className="font-medium text-white/80">{tests.length}</span>
        </p>
      </div>

      {/* Referring Doctor */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-white/60">Médico Referente (Opcional)</label>
        <input
          type="text"
          value={referringDoctor}
          onChange={(e) => setReferringDoctor(e.target.value)}
          placeholder="Nombre del médico que refiere"
          className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="mb-6 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
        <p className="text-sm font-medium text-emerald-400 mb-1">Instrucciones de llenado:</p>
        <p className="text-xs text-white/60 leading-relaxed">
          Completa los campos requeridos de cada examen. Puedes agilizar la transcripción presionando la tecla{" "}
          <span className="font-semibold text-emerald-300">"Enter"</span> para saltar automáticamente al siguiente input.
        </p>
      </div>


      {/* Accordion of test entry forms */}
      <div className="space-y-3">
        {tests.map((testEntry, idx) => {
          const isExpanded = expandedIdx === idx
          const isEntered = isTestEntryFilled(testEntry) || testEntry.status === "validated"

          return (
            <div
              key={testEntry.catalogId}
              className="overflow-hidden rounded-xl border border-white/10 bg-surface-800 transition"
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleExpand(idx)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isEntered
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/10 text-white/50"
                    }`}>
                    {isEntered ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div>
                    <span className="font-medium text-white">{testEntry.testName}</span>
                    <span className="ml-2 text-xs capitalize text-white/40">{testEntry.format}</span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-white/40" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/40" />
                )}
              </button>

              {/* Accordion body */}
              {isExpanded && (
                <div className="border-t border-white/10 px-5 py-5">
                  <EntryFormFactory
                    entry={testEntry}
                    onChange={(updated) => handleEntryChange(idx, updated)}
                    patient={patient}
                    onNext={() => handleNextTest(idx)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex justify-between border-t border-white/10 pt-6">
        <button
          onClick={onBack}
          disabled={loading}
          className="rounded-xl px-6 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Volver
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Guardando Orden..." : "Guardar Orden"}
        </button>
      </div>

      {/* Warning Modal for Empty Results */}
      {showWarningModal && (
        // Se cambió "items-center" por "items-end" y se agregó "pb-8" para darle un margen interno inferior
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 pb-[35vh]">
          {/* Se cambió "animate-scale-in" por "animate-slide-up" si deseas una animación más natural desde abajo */}
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-semibold text-white mb-2">Campos Vacíos Detectados</h3>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              Hay campos de resultados vacíos en una o más pruebas. ¿Deseas guardar la orden de todas formas? Puedes completarlos más tarde.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={loading}
                onClick={() => setShowWarningModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                Volver a revisar
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  setShowWarningModal(false)
                  executeSave()
                }}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-amber-500 disabled:opacity-50"
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
