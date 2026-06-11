import { useState } from "react"
import type { Patient } from "@/shared/types"
import Step1Patient from "../components/workflow/Step1_Patient"

export default function OrderWorkflowPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [patient, setPatient] = useState<Patient | null>(null)

  return (
    <div className="mx-auto max-w-5xl py-6">
      {/* Basic Step Indicator for now */}
      <div className="mb-8 flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary-400" : "text-white/40"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${step >= 1 ? "border-primary-400 bg-primary-400/20" : "border-white/20"}`}>
            1
          </div>
          <span className="font-medium">Paciente</span>
        </div>
        <div className="h-[2px] w-12 bg-white/10" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary-400" : "text-white/40"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${step >= 2 ? "border-primary-400 bg-primary-400/20" : "border-white/20"}`}>
            2
          </div>
          <span className="font-medium">Pruebas</span>
        </div>
        <div className="h-[2px] w-12 bg-white/10" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary-400" : "text-white/40"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${step >= 3 ? "border-primary-400 bg-primary-400/20" : "border-white/20"}`}>
            3
          </div>
          <span className="font-medium">Resultados</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-6 shadow-xl backdrop-blur-sm sm:p-10">
        {step === 1 && (
          <Step1Patient
            selectedPatient={patient}
            onPatientSelect={setPatient}
            onNext={() => {
              if (patient) setStep(2)
            }}
          />
        )}
        
        {step === 2 && (
          <div className="text-center py-10">
            <h2 className="text-xl text-white">Paso 2: Selección de Pruebas</h2>
            <p className="mt-2 text-white/60">En construcción (Fase 2)...</p>
            <button
              onClick={() => setStep(1)}
              className="mt-6 text-primary-400 hover:text-primary-300"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
