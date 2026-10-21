import { useState } from "react"
import { Search, Loader2, UserCheck, X } from "lucide-react"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { usePatientSearch } from "@/features/patients/hooks/usePatientSearch"
import type { Patient } from "@/shared/types"

interface PatientSearchSectionProps {
  selectedPatient: Patient | null
  onPatientSelect: (patient: Patient | null) => void
}

export default function PatientSearchSection({
  selectedPatient,
  onPatientSelect,
}: PatientSearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 400)

  const { patient, loading, error, setPatient } = usePatientSearch(debouncedSearch)

  const handleSelectFound = (foundPatient: Patient) => {
    onPatientSelect(foundPatient)
    setSearchTerm("")
    setPatient(null)
  }

  const handleClearSelected = () => {
    onPatientSelect(null)
    setSearchTerm("")
    setPatient(null)
  }

  if (selectedPatient) {
    return (
      <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/30 text-primary-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70">
                  C.I: {selectedPatient.nationalId}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {selectedPatient.age ? `Edad: ${selectedPatient.age} años` : "Edad no registrada"} • Género: {selectedPatient.sex === "M" ? "Masculino" : "Femenino"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearSelected}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
            Cambiar / Manual
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor="patient-search-input" className="mb-1.5 block text-xs font-medium text-white/70">
          Autocompletar con Paciente Registrado (Opcional)
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
            ) : (
              <Search className="h-4 w-4 text-white/40" />
            )}
          </div>
          <input
            id="patient-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cédula (ej. 28464803)..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/25 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Patient match found dropdown/card */}
      {patient && !loading && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div>
            <p className="text-sm font-medium text-emerald-200">
              {patient.firstName} {patient.lastName}
            </p>
            <p className="text-xs text-white/60">
              C.I: {patient.nationalId} {patient.age ? `• ${patient.age} años` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectFound(patient)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition"
          >
            Cargar Datos
          </button>
        </div>
      )}

      {debouncedSearch.length >= 3 && !loading && !patient && (
        <p className="text-xs text-white/40 italic">
          No se encontró ningún paciente con esa cédula. Puedes ingresar los datos manualmente abajo.
        </p>
      )}
    </div>
  )
}
