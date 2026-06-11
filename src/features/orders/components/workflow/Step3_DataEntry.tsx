import { useState } from "react"
import { ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react"
import type { Patient, TestEntry } from "@/shared/types"
import { useOrderMutation } from "../../hooks/useOrderMutation"
import EntryFormFactory from "../entry-forms/EntryFormFactory"

interface Step3DataEntryProps {
  patient: Patient
  tests: TestEntry[]
  onTestsChange: (tests: TestEntry[]) => void
  onBack: () => void
  onOrderSaved: (orderId: string) => void
}

export default function Step3DataEntry({
  patient,
  tests,
  onTestsChange,
  onBack,
  onOrderSaved,
}: Step3DataEntryProps) {
  const { saveOrder, loading, error } = useOrderMutation()
  const [expandedIdx, setExpandedIdx] = useState<number>(0)
  const [referringDoctor, setReferringDoctor] = useState("")

  const handleEntryChange = (idx: number, updated: TestEntry) => {
    const newTests = [...tests]
    newTests[idx] = updated
    onTestsChange(newTests)
  }

  const toggleExpand = (idx: number) => {
    setExpandedIdx(prev => (prev === idx ? -1 : idx))
  }

  const handleSave = async () => {
    const orderId = await saveOrder(patient, tests, referringDoctor)
    if (orderId) {
      onOrderSaved(orderId)
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

      {/* Accordion of test entry forms */}
      <div className="space-y-3">
        {tests.map((testEntry, idx) => {
          const isExpanded = expandedIdx === idx
          const isEntered = testEntry.status === "entered" || testEntry.status === "validated"

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
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    isEntered
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
    </div>
  )
}
