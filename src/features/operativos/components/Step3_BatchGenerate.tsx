import { useState } from "react"
import type { BatchEntry, TestEntry, LabConfig } from "@/shared/types"
import { useGenerateBatchReport } from "../hooks/useGenerateBatchReport"
import { FileText, Loader2, ExternalLink, X, Check } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import toast from "react-hot-toast"

interface Step3BatchGenerateProps {
  batchName: string
  templateTests: TestEntry[]
  entries: BatchEntry[]
  referringDoctor?: string
  batchId?: string
  onBack: () => void
  onComplete: () => void
}

export default function Step3BatchGenerate({
  batchName,
  templateTests,
  entries,
  referringDoctor,
  batchId,
  onBack,
  onComplete,
}: Step3BatchGenerateProps) {
  const { saveBatch, generateBatchPdf, isGenerating, progress, error } = useGenerateBatchReport()

  const [layoutMode, setLayoutMode] = useState<"single" | "dual">("single")
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)

  const handleGenerateClick = () => {
    setShowSignatureModal(true)
  }

  const handleConfirmGenerate = async (includeSignature: boolean) => {
    setShowSignatureModal(false)

    try {
      // 1. Obtener información del laboratorio
      const configDoc = await getDoc(doc(db, "config", "lab"))
      let labInfo: LabConfig = {
        labName: "Laboratorio Clínico",
        address: "Dirección",
        phone: "Tlf",
        signatureUrl: "/firma.jpg",
      }

      if (configDoc.exists()) {
        labInfo = configDoc.data() as LabConfig
      }

      if (!includeSignature) {
        labInfo.signatureUrl = ""
      } else if (!labInfo.signatureUrl) {
        labInfo.signatureUrl = "/firma.jpg"
      }

      // 2. Guardar en Firestore si no se ha guardado previamente o si queremos actualizar
      const savedId = await saveBatch(batchName, templateTests, entries, referringDoctor, batchId)
      if (!savedId) {
        toast.error("Error al guardar los registros del operativo en Firestore")
        return
      }

      // 3. Generar el PDF consolidado masivo y subirlo a Storage pasándole el ID
      const pdfUrl = await generateBatchPdf(entries, labInfo, layoutMode, referringDoctor, savedId)
      if (pdfUrl) {
        setGeneratedPdfUrl(pdfUrl)
        window.open(pdfUrl, "_blank")
        toast.success("PDF consolidado generado con éxito!")
      } else {
        toast.error("Error al generar el PDF consolidado")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error general en el proceso de generación")
    }
  }

  return (
    <div className="animate-slide-up space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-semibold text-white">Revisión y Generación Masiva</h2>
        <p className="text-sm text-white/60">
          Revisa el lote de pacientes y selecciona la distribución del reporte antes de generar el PDF consolidado.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-surface-950 p-4 border border-white/5 space-y-2">
          <span className="text-xs text-white/40 block">OPERATIVO / LOTE</span>
          <span className="text-base font-bold text-white block">{batchName}</span>
        </div>
        <div className="rounded-xl bg-surface-950 p-4 border border-white/5 space-y-2">
          <span className="text-xs text-white/40 block">EXÁMENES SELECCIONADOS</span>
          <div className="flex flex-wrap gap-1">
            {templateTests.map((t) => (
              <span key={t.catalogId} className="bg-primary-500/10 text-primary-400 text-xs px-2 py-0.5 rounded">
                {t.testName}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-surface-950 p-4 border border-white/5 space-y-2">
          <span className="text-xs text-white/40 block">TOTAL PACIENTES</span>
          <span className="text-base font-bold text-white block">{entries.length} pacientes</span>
        </div>
      </div>

      {/* Selector de Layout */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Formato de Impresión</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Opción 1 por página */}
          <div
            onClick={() => setLayoutMode("single")}
            className={`cursor-pointer rounded-xl border p-4 transition ${
              layoutMode === "single"
                ? "border-primary-500 bg-primary-500/5 text-white"
                : "border-white/10 bg-surface-900/50 hover:bg-white/5 text-white/70"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm">Estándar (1 Paciente por página)</span>
              {layoutMode === "single" && <Check className="h-4 w-4 text-primary-400" />}
            </div>
            <p className="text-xs text-white/40">
              Genera una página completa del tamaño de carta para cada paciente. Recomendado para exámenes de múltiples campos.
            </p>
          </div>

          {/* Opción 2 por página */}
          <div
            onClick={() => setLayoutMode("dual")}
            className={`rounded-xl border p-4 transition cursor-pointer ${
              layoutMode === "dual"
                ? "border-primary-500 bg-primary-500/5 text-white"
                : "border-white/10 bg-surface-900/50 hover:bg-white/5 text-white/70"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm">Ahorro de Impresión (2 Pacientes por hoja)</span>
              {layoutMode === "dual" && <Check className="h-4 w-4 text-primary-400" />}
            </div>
            <p className="text-xs text-white/40">
              Divide la hoja en dos reportes compactos. Ideal para ahorrar hojas en pruebas como V.D.R.L. y otros formatos cortos.
            </p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="border-t border-white/10 pt-6 flex justify-between items-center">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          Atrás
        </button>

        <div className="flex gap-3">
          {generatedPdfUrl ? (
            <div className="flex gap-2">
              <a
                href={generatedPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-glow-primary hover:bg-blue-500"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir PDF Consolidado
              </a>
              <button
                onClick={onComplete}
                className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
              >
                Terminar Operativo
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-glow-primary hover:bg-primary-500 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando y Generando ({progress}%)
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generar PDF Consolidado
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Modal de Firma */}
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
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                No, sin firma
              </button>
              <button
                onClick={() => handleConfirmGenerate(true)}
                className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-glow-primary hover:bg-primary-500"
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
