import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import { CheckCircle2, FileText, Loader2, ExternalLink, X } from "lucide-react"
import type { Patient, TestEntry, OrderResult } from "@/shared/types"
import Step1Patient from "../components/workflow/Step1_Patient"
import Step2TestSelection from "../components/workflow/Step2_TestSelection"
import Step3DataEntry from "../components/workflow/Step3_DataEntry"
import { seedCatalog } from "@/features/catalog/utils/seedCatalog"
import { useGenerateReport } from "@/features/reports/hooks/useGenerateReport"
import toast from "react-hot-toast"

export default function OrderWorkflowPage() {
  const { generateAndSavePdf, isGenerating, error: reportError } = useGenerateReport()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [step, setStep] = useState<1 | 2 | 3 | "done">(1)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [selectedTests, setSelectedTests] = useState<TestEntry[]>([])
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
  
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  useEffect(() => {
    seedCatalog().catch(console.error)
  }, [])

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId) {
      loadOrderForEditing(editId)
    }
  }, [searchParams])

  const loadOrderForEditing = async (orderId: string) => {
    setIsLoadingEdit(true)
    try {
      const orderDoc = await getDoc(doc(db, "orders_results", orderId))
      if (!orderDoc.exists()) {
        toast.error("La orden no existe")
        return
      }
      const order = { id: orderDoc.id, ...orderDoc.data() } as OrderResult

      const patientDoc = await getDoc(doc(db, "patients", order.patientId))
      if (patientDoc.exists()) {
        setPatient({ id: patientDoc.id, ...patientDoc.data() } as Patient)
      } else {
        toast.error("El paciente de esta orden no fue encontrado")
        return
      }

      setSelectedTests(order.tests)
      setSavedOrderId(order.id)
      setStep(3) // Jump directly to data entry
    } catch (error) {
      console.error("Error loading order for edit:", error)
      toast.error("Error al cargar la orden")
    } finally {
      setIsLoadingEdit(false)
    }
  }

  const handleOrderSaved = (orderId: string) => {
    setSavedOrderId(orderId)
    setStep("done")
  }

  const handleNewOrder = () => {
    setStep(1)
    setPatient(null)
    setSelectedTests([])
    setSavedOrderId(null)
    setGeneratedPdfUrl(null)
    setShowSignatureModal(false)
  }

  const handleGenerateClick = () => {
    setShowSignatureModal(true)
  }

  const handleConfirmGenerate = async (includeSignature: boolean) => {
    if (!savedOrderId) return
    setShowSignatureModal(false)
    const url = await generateAndSavePdf(savedOrderId, includeSignature)
    if (url) {
      setGeneratedPdfUrl(url)
      window.open(url, "_blank")
    }
  }

  const currentStep = step === "done" ? 3 : step

  return (
    <div className="mx-auto max-w-5xl py-6 relative">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-4">
        {[
          { num: 1, label: "Paciente" },
          { num: 2, label: "Pruebas" },
          { num: 3, label: "Resultados" },
        ].map(({ num, label }, idx) => (
          <div key={num} className="flex items-center gap-4">
            {idx > 0 && (
              <div className={`h-[2px] w-12 ${currentStep >= num ? "bg-primary-500/40" : "bg-white/10"}`} />
            )}
            <div className={`flex items-center gap-2 ${currentStep >= num ? "text-primary-400" : "text-white/40"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                step === "done" && num === 3
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                  : currentStep >= num
                    ? "border-primary-400 bg-primary-400/20"
                    : "border-white/20"
              }`}>
                {step === "done" && num === 3 ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span className="hidden font-medium sm:inline">{label}</span>
            </div>
          </div>
        ))}
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
          <Step2TestSelection
            selectedTests={selectedTests}
            onTestsChange={setSelectedTests}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && patient && (
          <Step3DataEntry
            patient={patient}
            tests={selectedTests}
            orderId={savedOrderId}
            onTestsChange={setSelectedTests}
            onBack={() => setStep(2)}
            onOrderSaved={handleOrderSaved}
          />
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-up">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Orden Guardada!</h2>
            <p className="mt-2 text-white/60">
              La orden ha sido guardada exitosamente.
            </p>
            {savedOrderId && (
              <p className="mt-1 text-xs font-mono text-white/40">
                ID: {savedOrderId}
              </p>
            )}

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
              {generatedPdfUrl ? (
                <a
                  href={generatedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-blue-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir PDF
                </a>
              ) : (
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {isGenerating ? "Generando..." : "Generar Reporte PDF"}
                </button>
              )}

              <button
                onClick={handleNewOrder}
                className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Nueva Orden
              </button>
            </div>

            {reportError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {reportError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signature Confirmation Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowSignatureModal(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-2 text-lg font-bold text-white">¿Incluir firma digital en el reporte?</h3>
            <p className="mb-6 text-sm text-white/60">
              Si tu configuración de laboratorio tiene una firma digital, puedes elegir incluirla o generar el reporte sin firma.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => handleConfirmGenerate(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                No, sin firma
              </button>
              <button
                onClick={() => handleConfirmGenerate(true)}
                className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500"
              >
                Sí, incluir firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
