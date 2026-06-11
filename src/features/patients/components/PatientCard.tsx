import { User, Calendar, Phone, MapPin, Hash } from "lucide-react"
import type { Patient } from "@/shared/types"

interface PatientCardProps {
  patient: Patient
  onClear?: () => void
}

export default function PatientCard({ patient, onClear }: PatientCardProps) {
  // Simple calculation for age based on dateOfBirth (Timestamp)
  const calculateAge = (dobTimestamp: any) => {
    if (!dobTimestamp) return "N/A"
    const dob = dobTimestamp.toDate ? dobTimestamp.toDate() : new Date(dobTimestamp)
    const diff_ms = Date.now() - dob.getTime()
    const age_dt = new Date(diff_ms)
    return Math.abs(age_dt.getUTCFullYear() - 1970)
  }

  const age = calculateAge(patient.dateOfBirth)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-900 p-5 shadow-card">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-primary-500/10 blur-2xl" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20 text-primary-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {patient.firstName} {patient.lastName}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {patient.nationalId}
              </span>
              <span className="flex items-center gap-1">
                {patient.sex === "M" ? "Masculino" : "Femenino"}
              </span>
            </div>
          </div>
        </div>
        
        {onClear && (
          <button
            onClick={onClear}
            className="text-sm font-medium text-red-400 hover:text-red-300"
          >
            Cambiar
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Calendar className="h-4 w-4 text-white/40" />
          <span>Edad: {age} años</span>
        </div>
        
        {patient.phone && (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Phone className="h-4 w-4 text-white/40" />
            <span>{patient.phone}</span>
          </div>
        )}
        
        {patient.address && (
          <div className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2">
            <MapPin className="h-4 w-4 text-white/40" />
            <span className="truncate">{patient.address}</span>
          </div>
        )}
      </div>
    </div>
  )
}
