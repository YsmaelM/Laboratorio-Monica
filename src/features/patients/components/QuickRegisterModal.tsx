import { X, Loader2, AlertCircle } from "lucide-react"
import { usePatientMutation } from "../hooks/usePatientMutation"
import type { Patient } from "@/shared/types"
import { Timestamp } from "firebase/firestore"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const patientSchema = z.object({
  nationalId: z.string().min(1, "La cédula/ID es requerida"),
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  dateOfBirth: z.string().min(1, "La fecha es requerida"),
  sex: z.enum(["M", "F"]),
  phone: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientSchema>

interface QuickRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  initialNationalId?: string
  onSuccess: (patient: Patient) => void
}

export default function QuickRegisterModal({ isOpen, onClose, initialNationalId = "", onSuccess }: QuickRegisterModalProps) {
  const { createPatient, loading, error: mutationError } = usePatientMutation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nationalId: initialNationalId,
      sex: "M",
    }
  })

  if (!isOpen) return null

  const onSubmit = async (data: PatientFormValues) => {
    const dobDate = new Date(data.dateOfBirth)
    const dob = new Date(dobDate.getTime() + Math.abs(dobDate.getTimezoneOffset() * 60000))
    
    const patientData: Omit<Patient, "id" | "createdAt" | "updatedAt"> = {
      nationalId: data.nationalId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: Timestamp.fromDate(dob),
      sex: data.sex,
    }

    if (data.phone?.trim()) {
      patientData.phone = data.phone.trim()
    }

    const newPatient = await createPatient(patientData)

    if (newPatient) {
      reset()
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Cédula / ID *</label>
              <input
                type="text"
                {...register("nationalId")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.nationalId ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.nationalId && <p className="mt-1 text-xs text-red-400">{errors.nationalId.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Nombres *</label>
              <input
                type="text"
                {...register("firstName")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.firstName ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Apellidos *</label>
              <input
                type="text"
                {...register("lastName")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.lastName ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Fecha de Nacimiento *</label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.dateOfBirth ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              />
              {errors.dateOfBirth && <p className="mt-1 text-xs text-red-400">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Sexo *</label>
              <select
                {...register("sex")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${
                  errors.sex ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                }`}
              >
                <option value="M" className="bg-surface-900">Masculino</option>
                <option value="F" className="bg-surface-900">Femenino</option>
              </select>
              {errors.sex && <p className="mt-1 text-xs text-red-400">{errors.sex.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Teléfono (Opcional)</label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {mutationError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{mutationError}</p>
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
