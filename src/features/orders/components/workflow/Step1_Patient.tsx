import { useState } from "react"
import type { Patient } from "@/shared/types"
import PatientSearchInput from "@/features/patients/components/PatientSearchInput"
import PatientCard from "@/features/patients/components/PatientCard"
import QuickRegisterModal from "@/features/patients/components/QuickRegisterModal"

interface Step1PatientProps {
  selectedPatient: Patient | null
  onPatientSelect: (patient: Patient | null) => void
  onNext: () => void
}

export default function Step1Patient({ selectedPatient, onPatientSelect, onNext }: Step1PatientProps) {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [registerInitialId, setRegisterInitialId] = useState("")

  const handleRegisterNew = (nationalId: string) => {
    setRegisterInitialId(nationalId)
    setIsRegisterModalOpen(true)
  }

  const handleRegisterSuccess = (newPatient: Patient) => {
    onPatientSelect(newPatient)
    setIsRegisterModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white">Paso 1: Información del Paciente</h2>
        <p className="mt-1 text-sm text-white/60">Busque un paciente existente o registre uno nuevo para comenzar la orden.</p>
      </div>

      {!selectedPatient ? (
        <div className="mx-auto max-w-xl">
          <PatientSearchInput
            onPatientFound={onPatientSelect}
            onRegisterNew={handleRegisterNew}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          <PatientCard
            patient={selectedPatient}
            onClear={() => onPatientSelect(null)}
          />
          
          <div className="flex justify-end">
            <button
              onClick={onNext}
              className="rounded-xl bg-primary-600 px-6 py-3 font-medium text-white shadow-glow-primary transition hover:bg-primary-500"
            >
              Continuar a Selección de Pruebas
            </button>
          </div>
        </div>
      )}

      <QuickRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialNationalId={registerInitialId}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  )
}
