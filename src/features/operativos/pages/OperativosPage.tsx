import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import { CheckCircle2, Loader2 } from "lucide-react"
import type { TestEntry, BatchOperation } from "@/shared/types"
import Step1TestTemplate from "../components/Step1_TestTemplate"
import Step2PatientBatch from "../components/Step2_PatientBatch"
import Step3BatchGenerate from "../components/Step3_BatchGenerate"
import { useBatchState } from "../hooks/useBatchState"
import toast from "react-hot-toast"

export default function OperativosPage() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<1 | 2 | 3 | "done">(1)
  const [batchName, setBatchName] = useState("")
  const [referringDoctor, setReferringDoctor] = useState("")
  const [selectedTests, setSelectedTests] = useState<TestEntry[]>([])
  const [savedBatchId, setSavedBatchId] = useState<string | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const {
    patients,
    paginatedPatients,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    completedCount,
    addPatient,
    addBatchPatients,
    removePatient,
    updatePatientTests,
    applyResultToAll,
    setPatients,
  } = useBatchState(selectedTests)

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId) {
      loadBatchForEditing(editId)
    }
  }, [searchParams])

  const loadBatchForEditing = async (batchId: string) => {
    setIsLoadingEdit(true)
    try {
      const batchDoc = await getDoc(doc(db, "batch_operations", batchId))
      if (!batchDoc.exists()) {
        toast.error("El operativo no existe")
        return
      }
      const batch = { id: batchDoc.id, ...batchDoc.data() } as BatchOperation

      setBatchName(batch.name)
      setReferringDoctor(batch.referringDoctor || "")
      setSelectedTests(batch.templateTests)
      setSavedBatchId(batch.id || null)

      // Cargar pacientes
      const batchEntries = batch.entries.map((entry) => ({
        patientId: entry.patientId,
        patient: entry.patient,
        tests: entry.tests,
        isComplete: entry.isComplete,
      }))
      setPatients(batchEntries)

      setStep(2) // Ir directamente a la carga/edición de resultados
    } catch (error) {
      console.error("Error loading batch for edit:", error)
      toast.error("Error al cargar el operativo para editar")
    } finally {
      setIsLoadingEdit(false)
    }
  }

  // Reiniciar estado al volver a crear
  const handleNewOperativo = () => {
    setStep(1)
    setBatchName("")
    setReferringDoctor("")
    setSelectedTests([])
    setPatients([])
    setSavedBatchId(null)
    setCurrentPage(1)
  }

  const currentStep = step === "done" ? 3 : step

  if (isLoadingEdit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 text-white/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-4 text-sm font-medium">Cargando datos del operativo para edición...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl py-6 relative px-4">
      {/* Indicador de pasos */}
      <div className="mb-8 flex items-center justify-center gap-4">
        {[
          { num: 1, label: "Configurar Lote" },
          { num: 2, label: "Resultados Pacientes" },
          { num: 3, label: "Reportes" },
        ].map(({ num, label }, idx) => (
          <div key={num} className="flex items-center gap-4">
            {idx > 0 && (
              <div className={`h-[2px] w-12 ${currentStep >= num ? "bg-primary-500/40" : "bg-white/10"}`} />
            )}
            <div className={`flex items-center gap-2 ${currentStep >= num ? "text-primary-400" : "text-white/40"}`}>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  step === "done" && num === 3
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                    : currentStep >= num
                    ? "border-primary-400 bg-primary-400/20"
                    : "border-white/20"
                }`}
              >
                {step === "done" && num === 3 ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span className="hidden font-medium sm:inline text-xs">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Contenedor Principal */}
      <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-6 shadow-xl backdrop-blur-sm sm:p-10">
        {step === 1 && (
          <Step1TestTemplate
            batchName={batchName}
            onBatchNameChange={setBatchName}
            referringDoctor={referringDoctor}
            onReferringDoctorChange={setReferringDoctor}
            selectedTests={selectedTests}
            onTestsChange={setSelectedTests}
            onNext={() => {
              if (batchName.trim() && selectedTests.length > 0) setStep(2)
            }}
          />
        )}

        {step === 2 && (
          <Step2PatientBatch
            templateTests={selectedTests}
            patients={patients}
            paginatedPatients={paginatedPatients}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            completedCount={completedCount}
            addPatient={addPatient}
            addBatchPatients={addBatchPatients}
            removePatient={removePatient}
            updatePatientTests={updatePatientTests}
            applyResultToAll={applyResultToAll}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3BatchGenerate
            batchName={batchName}
            templateTests={selectedTests}
            entries={patients}
            referringDoctor={referringDoctor}
            batchId={savedBatchId || undefined}
            onBack={() => setStep(2)}
            onComplete={() => setStep("done")}
          />
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-up">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Operativo Finalizado!</h2>
            <p className="mt-2 text-white/60">El lote del operativo ha sido procesado y archivado.</p>
            <button
              onClick={handleNewOperativo}
              className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-glow-primary hover:bg-primary-500"
            >
              Nuevo Operativo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
