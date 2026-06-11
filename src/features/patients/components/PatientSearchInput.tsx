import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { usePatientSearch } from "../hooks/usePatientSearch"
import type { Patient } from "@/shared/types"

interface PatientSearchInputProps {
  onPatientFound: (patient: Patient | null) => void
  onRegisterNew: (nationalId: string) => void
}

export default function PatientSearchInput({ onPatientFound, onRegisterNew }: PatientSearchInputProps) {
  const [inputValue, setInputValue] = useState("")
  const debouncedValue = useDebounce(inputValue, 500)
  
  const { patient, loading, error, setPatient } = usePatientSearch(debouncedValue)

  // Notify parent when patient is found
  useEffect(() => {
    onPatientFound(patient)
  }, [patient, onPatientFound])

  const handleClear = () => {
    setInputValue("")
    setPatient(null)
  }

  return (
    <div className="w-full">
      <label htmlFor="patient-search" className="mb-2 block text-sm font-medium text-white/80">
        Buscar Paciente (Cédula / ID)
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
          ) : (
            <Search className="h-5 w-5 text-white/40" />
          )}
        </div>
        <input
          type="text"
          id="patient-search"
          className="block w-full rounded-xl border border-white/10 bg-surface-900 py-3 pl-10 pr-3 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Ej. 402-1234567-8"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center text-sm text-white/40 hover:text-white/80"
          >
            Limpiar
          </button>
        )}
      </div>
      
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      
      {/* Show register prompt if typed at least 3 chars, finished loading, and no patient found */}
      {debouncedValue.length >= 3 && !loading && !patient && !error && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-accent-500/20 bg-accent-500/10 px-4 py-3">
          <span className="text-sm text-accent-100">Paciente no encontrado.</span>
          <button
            type="button"
            onClick={() => onRegisterNew(inputValue)}
            className="rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-500"
          >
            Registrar Nuevo
          </button>
        </div>
      )}
    </div>
  )
}
