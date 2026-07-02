import { User, Calendar, Phone, MapPin, IdCard, CircleX } from "lucide-react"
import type { Patient } from "@/shared/types"

interface PatientCardProps {
  patient: Patient
  onClear?: () => void
}

export default function PatientCard({ patient, onClear }: PatientCardProps) {
  // Simple calculation for age based on direct age or dateOfBirth (Timestamp)
  const calculateAge = (p: Patient) => {
    if (p.age !== undefined) return p.age
    const dobTimestamp = p.dateOfBirth
    if (!dobTimestamp) return "N/A"
    let dob: Date;
    try {
      if (dobTimestamp && typeof dobTimestamp === "object" && "toDate" in dobTimestamp && typeof (dobTimestamp as any).toDate === "function") {
        dob = (dobTimestamp as any).toDate();
      } else if (dobTimestamp && typeof dobTimestamp === "object" && "seconds" in dobTimestamp) {
        dob = new Date((dobTimestamp as any).seconds * 1000);
      } else {
        dob = new Date(dobTimestamp as any);
      }
    } catch {
      dob = new Date();
    }
    const diff_ms = Date.now() - dob.getTime()
    const age_dt = new Date(diff_ms)
    return Math.abs(age_dt.getUTCFullYear() - 1970)
  }

  const age = calculateAge(patient)

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">

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
                  <IdCard className="h-5 w-5" />
                  {patient.nationalId}
                </span>
                <span className="flex items-center gap-1">
                  {patient.sex === "M" ? "Masculino" : "Femenino"}
                </span>
              </div>
            </div>
          </div>


          <button
            onClick={onClear}
            className=" relative z-50 cursor-pointer transition-all duration-200 hover:scale-110"
          >
            <CircleX className="h-8 w-8 text-red-500/40 hover:text-red-500 transition-colors" />
          </button>

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
    </div>


  )
}
