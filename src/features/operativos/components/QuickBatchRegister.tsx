import { useState, useRef, useEffect } from "react"
import { Plus, Save, Loader2, Trash2, AlertCircle } from "lucide-react"
import type { Patient, TestEntry } from "@/shared/types"
import { usePatientMutation } from "@/features/patients/hooks/usePatientMutation"
import toast from "react-hot-toast"

interface QuickRow {
  id: string
  firstName: string
  lastName: string
  nationalId: string
  age: string
  sex: "M" | "F"
}

function emptyRow(): QuickRow {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    nationalId: "",
    age: "",
    sex: "M",
  }
}

interface QuickBatchRegisterProps {
  templateTests: TestEntry[]
  onPatientsRegistered: (patients: Patient[], applyResult: boolean, resultTests: TestEntry[]) => void
  onClose: () => void
}

export default function QuickBatchRegister({ templateTests, onPatientsRegistered, onClose }: QuickBatchRegisterProps) {
  const [rows, setRows] = useState<QuickRow[]>([emptyRow()])
  const [isSaving, setIsSaving] = useState(false)
  const [applyResultToAll, setApplyResultToAll] = useState(true)
  const [resultValue, setResultValue] = useState("")
  const { createPatient } = usePatientMutation()
  const lastRowRef = useRef<HTMLInputElement>(null)

  // Focus en la primera celda de la última fila nueva
  useEffect(() => {
    if (lastRowRef.current) {
      lastRowRef.current.focus()
    }
  }, [rows.length])

  const updateRow = (idx: number, field: keyof QuickRow, val: string) => {
    setRows((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: val }
      return copy
    })
  }

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()])
  }

  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // Si estamos en el último campo de la última fila, agregar nueva fila
      if (field === "sex" && rowIdx === rows.length - 1) {
        addRow()
      } else {
        // Mover al siguiente input
        const form = (e.target as HTMLElement).closest(".batch-register-grid")
        if (form) {
          const inputs = Array.from(form.querySelectorAll("input, select")) as HTMLElement[]
          const currentIdx = inputs.indexOf(e.target as HTMLElement)
          if (currentIdx >= 0 && currentIdx < inputs.length - 1) {
            inputs[currentIdx + 1].focus()
          } else if (rowIdx === rows.length - 1) {
            addRow()
          }
        }
      }
    }
  }

  const validRows = rows.filter(
    (r) => r.firstName.trim() && r.lastName.trim() && r.nationalId.trim()
  )

  const handleSaveAll = async () => {
    if (validRows.length === 0) {
      toast.error("Debes llenar al menos un paciente con nombre, apellido y cédula.")
      return
    }

    setIsSaving(true)
    const savedPatients: Patient[] = []
    let errorCount = 0

    for (const row of validRows) {
      const patientData: Omit<Patient, "id" | "createdAt" | "updatedAt"> = {
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        nationalId: row.nationalId.trim(),
        age: row.age ? parseInt(row.age) : undefined,
        sex: row.sex,
      }

      const saved = await createPatient(patientData)
      if (saved) {
        savedPatients.push(saved)
      } else {
        errorCount++
      }
    }

    setIsSaving(false)

    if (savedPatients.length > 0) {
      // Preparar los tests con resultado aplicado si el usuario lo quiso
      let resultTests = templateTests
      if (applyResultToAll && resultValue.trim()) {
        resultTests = templateTests.map((t) => {
          if (t.format === "simple") {
            return { ...t, data: { ...t.data, result: resultValue.trim() } }
          }
          if (t.format === "custom") {
            // Rellenar todos los campos de tipo input editable en el customTemplate con el valor masivo
            const dataCopy = { ...t.data }
            const template = t.customTemplate
            if (template?.rows) {
              template.rows.forEach((row) => {
                if (row.type === "test" || row.type === "simple") {
                  row.columns.forEach((col) => {
                    if (
                      !col.isHeaderOnly &&
                      !col.isFixed &&
                      col.type !== "formula" &&
                      col.type !== "reference" &&
                      col.type !== "unit"
                    ) {
                      dataCopy[`${row.id}|${col.id}`] = resultValue.trim()
                    }
                  })
                }
              })
            }
            return { ...t, data: dataCopy }
          }
          if (t.format === "culture") {
            return { ...t, data: { ...t.data, cultureResult: resultValue.trim(), sampleType: "Sangre" } }
          }
          return t
        })
      }

      toast.success(`${savedPatients.length} paciente(s) registrado(s) correctamente.`)
      onPatientsRegistered(savedPatients, applyResultToAll && !!resultValue.trim(), resultTests)
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} paciente(s) no se pudieron registrar (posible cédula duplicada).`)
    }
  }

  // Mostrar la opción de resultado rápido si hay al menos una prueba
  const hasTests = templateTests.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Registro Rápido de Pacientes</h3>
            <p className="text-xs text-white/50 mt-1">
              Completa los datos y presiona Enter para saltar al siguiente campo o agregar una nueva fila.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabla de inputs */}
        <div className="batch-register-grid overflow-x-auto rounded-xl border border-white/10 bg-surface-950 mb-6">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/60 w-10">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/60">Nombre *</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/60">Apellido *</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/60">Cédula *</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/60 w-20">Edad</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/60 w-24">Sexo</th>
                <th className="px-3 py-2.5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row, idx) => (
                <tr key={row.id} className="group hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 text-xs text-white/40">{idx + 1}</td>
                  <td className="px-3 py-1.5">
                    <input
                      ref={idx === rows.length - 1 ? lastRowRef : undefined}
                      type="text"
                      value={row.firstName}
                      onChange={(e) => updateRow(idx, "firstName", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "firstName")}
                      placeholder="Nombre"
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-xs text-white outline-none focus:border-primary-500 focus:bg-surface-900"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={row.lastName}
                      onChange={(e) => updateRow(idx, "lastName", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "lastName")}
                      placeholder="Apellido"
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-xs text-white outline-none focus:border-primary-500 focus:bg-surface-900"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={row.nationalId}
                      onChange={(e) => updateRow(idx, "nationalId", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "nationalId")}
                      placeholder="V-12345678"
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-xs text-white outline-none focus:border-primary-500 focus:bg-surface-900"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      value={row.age}
                      onChange={(e) => updateRow(idx, "age", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "age")}
                      placeholder="—"
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-xs text-white outline-none focus:border-primary-500 focus:bg-surface-900"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={row.sex}
                      onChange={(e) => updateRow(idx, "sex", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "sex")}
                      className="w-full rounded border border-transparent bg-transparent px-1 py-1.5 text-xs text-white outline-none focus:border-primary-500 focus:bg-surface-900"
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      disabled={rows.length <= 1}
                      className="rounded p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-white/60 hover:border-white/40 hover:text-white/80 mb-6"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar fila
        </button>

        {/* Opción de resultado masivo */}
        {hasTests && (
          <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-300 mb-3">
                  ¿Quieres que todos los pacientes de esta lista tengan el mismo resultado?
                </p>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={applyResultToAll}
                      onChange={() => setApplyResultToAll(true)}
                      className="accent-primary-500"
                    />
                    <span className="text-xs text-white/80">Sí, mismo resultado para todos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!applyResultToAll}
                      onChange={() => setApplyResultToAll(false)}
                      className="accent-primary-500"
                    />
                    <span className="text-xs text-white/80">No, ingresaré cada uno manualmente</span>
                  </label>
                </div>
                {applyResultToAll && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-white/60 shrink-0">Resultado:</label>
                    <select
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      className="rounded-lg border border-white/10 bg-surface-950 px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="No Reactivo">No Reactivo</option>
                      <option value="Reactivo">Reactivo</option>
                      <option value="Negativo">Negativo</option>
                      <option value="Positivo">Positivo</option>
                    </select>
                    <input
                      type="text"
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      placeholder="O escribir resultado personalizado..."
                      className="flex-1 rounded-lg border border-white/10 bg-surface-950 px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-white/40">
            {validRows.length} paciente(s) listo(s) para registrar
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || validRows.length === 0}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-glow-primary hover:bg-primary-500 disabled:opacity-50"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
              ) : (
                <><Save className="h-4 w-4" /> Registrar y Agregar ({validRows.length})</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
