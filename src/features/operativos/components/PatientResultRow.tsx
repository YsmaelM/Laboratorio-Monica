import { useState } from "react"
import type { BatchEntry, TestEntry } from "@/shared/types"
import { Trash2, Edit2, CheckCircle2, AlertCircle } from "lucide-react"

interface PatientResultRowProps {
  index: number
  entry: BatchEntry
  onRemove: () => void
  onUpdateTests: (tests: TestEntry[]) => void
  onOpenEditModal: () => void
}

export default function PatientResultRow({
  index,
  entry,
  onRemove,
  onUpdateTests,
  onOpenEditModal,
}: PatientResultRowProps) {
  const simpleTests = entry.tests.filter((t) => t.format === "simple")
  const complexTests = entry.tests.filter((t) => t.format !== "simple")

  const handleSimpleResultChange = (catalogId: string, val: string) => {
    const updated = entry.tests.map((t) => {
      if (t.catalogId === catalogId && t.format === "simple") {
        return {
          ...t,
          data: {
            ...t.data,
            result: val,
          },
        }
      }
      return t
    })
    onUpdateTests(updated)
  }

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition">
      <td className="px-4 py-3 text-xs text-white/40">{index}</td>
      <td className="px-4 py-3 font-medium text-sm text-white">
        {entry.patient.firstName} {entry.patient.lastName}
      </td>
      <td className="px-4 py-3 text-xs text-white/60 font-mono">{entry.patient.nationalId}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          {/* Inputs inline para tests simples */}
          {simpleTests.map((t) => (
            <div key={t.catalogId} className="flex items-center gap-2">
              <span className="text-xs text-white/50 w-24 truncate" title={t.testName}>
                {t.testName}:
              </span>
              <input
                type="text"
                value={t.data.result as string}
                onChange={(e) => handleSimpleResultChange(t.catalogId, e.target.value)}
                placeholder="Ingresar..."
                className="w-36 rounded border border-white/10 bg-surface-950 px-2 py-1 text-xs text-white outline-none focus:border-primary-500"
              />
            </div>
          ))}
          {/* Mensaje o botón para pruebas complejas */}
          {complexTests.length > 0 && (
            <span className="text-xs text-white/40 italic">
              {complexTests.length} prueba(s) compleja(s)
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {entry.isComplete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Completo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-500/20">
            <AlertCircle className="h-3 w-3" /> Pendiente
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onOpenEditModal}
            className="inline-flex items-center justify-center rounded bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            title="Editar formulario completo"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="inline-flex items-center justify-center rounded bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
            title="Eliminar paciente de la lista"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
