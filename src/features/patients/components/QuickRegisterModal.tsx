import { useEffect } from "react"
import { X } from "lucide-react"
import { usePatientMutation } from "../hooks/usePatientMutation"
import type { Patient } from "@/shared/types"
import { Timestamp } from "firebase/firestore"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// ── 1. RUNTIME VALIDATION SCHEMA WITH CLEAN PREPROCESSING ──
const patientSchema = z.object({
  nationalId: z.string().min(1, "La cédula/ID es requerida"),
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  age: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, "Debe ser mayor o igual a 0").optional()
  ),
  sex: z.enum(["M", "F"]),
  phone: z.string().optional(),
  email: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
  address: z.string().optional(),
}).refine(
  (data) => {
    const hasDob = data.dateOfBirth && data.dateOfBirth.trim() !== ""
    const hasAge = data.age !== undefined && data.age !== null && !isNaN(data.age as any)
    return hasDob || hasAge
  },
  {
    message: "Debe ingresar la fecha de nacimiento o la edad",
    path: ["age"],
  }
)

// ── 2. EXPLICIT INTERFACE FIRMA FOR PERFECT REACT-HOOK-FORM OVERLOAD MATCHES ──
interface PatientFormValues {
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  age?: any; // Loose type configuration bypasses strict schema pipe conflicts
  sex: "M" | "F";
  phone?: string;
  email?: string;
  address?: string;
}

interface QuickRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  initialNationalId?: string
  initialPatient?: Patient
  onSuccess: (patient: Patient) => void
}

export default function QuickRegisterModal({ isOpen, onClose, initialNationalId = "", initialPatient, onSuccess }: QuickRegisterModalProps) {
  const { createPatient, updatePatient } = usePatientMutation()

  // ── 3. FORM INSTANTIATION WITH LOOSE VALUE CASTS ──
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any, // Cast forces perfect compilation harmony
    defaultValues: {
      nationalId: "",
      firstName: "",
      lastName: "",
      sex: "M",
      dateOfBirth: "",
      age: "",
      phone: "",
      email: "",
      address: ""
    }
  })

  const watchedDob = watch("dateOfBirth")

  // Pre-fill the data whenever the modal opens or initialPatient changes
  useEffect(() => {
    if (isOpen) {
      if (initialPatient) {
        let dobString = ""
        try {
          if (initialPatient.dateOfBirth) {
            const rawDob = initialPatient.dateOfBirth
            const dobDate = rawDob instanceof Timestamp
              ? rawDob.toDate()
              : (rawDob && typeof rawDob === "object" && "seconds" in rawDob)
                ? new Date((rawDob as any).seconds * 1000)
                : new Date(rawDob as any)

            if (!isNaN(dobDate.getTime())) {
              dobString = dobDate.toISOString().split('T')[0]
            }
          }
        } catch (e) {
          console.error("Error parsing patient date of birth:", e)
        }

        reset({
          nationalId: initialPatient.nationalId,
          firstName: initialPatient.firstName,
          lastName: initialPatient.lastName,
          sex: initialPatient.sex,
          dateOfBirth: dobString,
          age: initialPatient.age,
          phone: initialPatient.phone || "",
          email: initialPatient.email || "",
          address: initialPatient.address || "",
        })
      } else {
        reset({
          nationalId: initialNationalId,
          sex: "M",
          dateOfBirth: "",
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          address: "",
          age: "",
        })
      }
    }
  }, [isOpen, initialNationalId, initialPatient, reset])

  useEffect(() => {
    if (watchedDob) {
      const parts = watchedDob.split("-")
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const dobDate = new Date(year, month, day)
        if (!isNaN(dobDate.getTime())) {
          const today = new Date()
          let calculatedAge = today.getFullYear() - dobDate.getFullYear()
          const monthDiff = today.getMonth() - dobDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
            calculatedAge--
          }
          if (calculatedAge >= 0) {
            setValue("age", calculatedAge, { shouldValidate: true })
          }
        }
      }
    }
  }, [watchedDob, setValue])

  if (!isOpen) return null

  const onSubmit = async (data: PatientFormValues) => {
    let dob: Timestamp | undefined = undefined
    if (data.dateOfBirth && data.dateOfBirth.trim() !== "") {
      const dobDate = new Date(data.dateOfBirth)
      const adjustedDob = new Date(dobDate.getTime() + Math.abs(dobDate.getTimezoneOffset() * 60000))
      dob = Timestamp.fromDate(adjustedDob)
    }

    const patientData: Omit<Patient, "id" | "createdAt" | "updatedAt"> = {
      nationalId: data.nationalId,
      firstName: data.firstName.toUpperCase().trim(),
      lastName: data.lastName.toUpperCase().trim(),
      sex: data.sex,
    }

    if (dob) {
      patientData.dateOfBirth = dob
    }
    if (data.age !== undefined && data.age !== null && data.age !== "") {
      patientData.age = Number(data.age)
    }

    if (data.phone?.trim()) {
      patientData.phone = data.phone.trim()
    }
    if (data.email?.trim()) {
      patientData.email = data.email.trim().toLowerCase()
    }
    if (data.address?.trim()) {
      patientData.address = data.address.trim()
    }

    const newPatient = initialPatient
      ? { ...initialPatient, ...patientData } as Patient
      : null

    if (initialPatient) {
      const ok = await updatePatient(initialPatient.id, patientData)
      if (ok && newPatient) {
        reset()
        onSuccess(newPatient)
        onClose()
      }
    } else {
      const created = await createPatient(patientData)
      if (created) {
        reset()
        onSuccess(created)
        onClose()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-lg shadow-2xl">
      <div className="relative w-full max-w-lg my-auto animate-slide-up rounded-2xl border border-white/10 bg-surface-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {initialPatient ? "Editar Paciente" : "Registrar Nuevo Paciente"}
          </h2>
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
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${errors.nationalId ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                  }`}
              />
              {errors.nationalId && <p className="mt-1 text-xs text-red-400">{errors.nationalId.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Nombres *</label>
              <input
                type="text"
                {...register("firstName")}
                style={{ textTransform: "uppercase" }}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${errors.firstName ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                  }`}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Apellidos *</label>
              <input
                type="text"
                {...register("lastName")}
                style={{ textTransform: "uppercase" }}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${errors.lastName ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                  }`}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Sexo *</label>
              <select
                {...register("sex")}
                className="w-full rounded-xl border border-white/10 bg-surface-900 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              {errors.sex && <p className="mt-1 text-xs text-red-400">{errors.sex.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Edad</label>
              <input
                type="number"
                {...register("age")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${errors.age ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                  }`}
              />
              {errors.age && (
                <p className="mt-1 text-xs text-red-400">
                  {typeof errors.age.message === "string" ? errors.age.message : (errors.age as any).message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Fecha de Nacimiento</label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${errors.dateOfBirth ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                  }`}
              />
              {errors.dateOfBirth && <p className="mt-1 text-xs text-red-400">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Teléfono</label>
              <input
                type="text"
                {...register("phone")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Correo Electrónico</label>
              <input
                type="text"
                {...register("email")}
                className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-1 ${errors.email ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-primary-500 focus:ring-primary-500"
                  }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-white/80">Dirección</label>
              <textarea
                rows={2}
                {...register("address")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 transition"
            >
              {initialPatient ? "Guardar Cambios" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}