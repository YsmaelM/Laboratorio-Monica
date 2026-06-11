import { useState, type FormEvent } from "react"
import { X, Loader2, AlertCircle } from "lucide-react"
import { usePatientMutation } from "../hooks/usePatientMutation"
import type { Patient } from "@/shared/types"
import { Timestamp } from "firebase/firestore"

interface QuickRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  initialNationalId?: string
  onSuccess: (patient: Patient) => void
}

export default function QuickRegisterModal({ isOpen, onClose, initialNationalId = "", onSuccess }: QuickRegisterModalProps) {
  const { createPatient, loading, error } = usePatientMutation()
  
  const [nationalId, setNationalId] = useState(initialNationalId)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [sex, setSex] = useState<"M" | "F">("M")
  const [phone, setPhone] = useState("")
  
  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Parse date into a Firebase Timestamp approximation (Date object)
    // Firestore Timestamp.fromDate() can be used before saving, or we just pass the Date
    const dobDate = new Date(dateOfBirth)
    // Add timezone offset to avoid previous day issues
    const dob = new Date(dobDate.getTime() + Math.abs(dobDate.getTimezoneOffset() * 60000))
    
    const patientData: Omit<Patient, "id" | "createdAt" | "updatedAt"> = {
      nationalId,
      firstName,
      lastName,
      dateOfBirth: Timestamp.fromDate(dob),
      sex,
    }

    if (phone.trim()) {
      patientData.phone = phone.trim()
    }

    const newPatient = await createPatient(patientData)

    if (newPatient) {
      onSuccess(newPatient)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg animate-slide-up rounded-2xl border border-white/10 bg-surface-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Registrar Nuevo Paciente</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Cédula / ID *</label>
              <input
                required
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Nombres *</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Apellidos *</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Fecha de Nacimiento *</label>
              <input
                required
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Sexo *</label>
              <select
                required
                value={sex}
                onChange={(e) => setSex(e.target.value as "M" | "F")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="M" className="bg-surface-900">Masculino</option>
                <option value="F" className="bg-surface-900">Femenino</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Teléfono (Opcional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Guardando..." : "Guardar Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
