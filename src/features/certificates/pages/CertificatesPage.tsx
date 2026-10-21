import { useState, useEffect, useRef } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import { pdf } from "@react-pdf/renderer"
import {
  FileText,
  ExternalLink,
  Download,
  Loader2,
  Eye
} from "lucide-react"
import toast from "react-hot-toast"
import type { LabConfig, CertificateData } from "@/shared/types"
import { useDebounce } from "@/shared/hooks/useDebounce"
import CertificateForm, { generateDefaultBodyText } from "../components/CertificateForm"
import { CertificateDocument } from "../components/pdf/CertificateDocument"

const DEFAULT_REASONS = [
  "se realizó pruebas de laboratorio",
  "asistió a consulta médica",
  "asistió para toma de muestra",
]

const getTodayString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function CertificatesPage() {
  const [labInfo, setLabInfo] = useState<LabConfig>({
    labName: "Laboratorio Clínico",
    address: "",
    phone: "",
    signatureUrl: "/firma.jpg",
  })
  const [predefinedReasons, setPredefinedReasons] = useState<string[]>(DEFAULT_REASONS)
  const [loadingConfig, setLoadingConfig] = useState(true)

  // Certificate form data
  const initialReason = DEFAULT_REASONS[0]
  const todayDate = getTodayString()

  const [formData, setFormData] = useState<CertificateData>(() => {
    const base: CertificateData = {
      firstName: "",
      lastName: "",
      nationalId: "",
      age: "",
      isMinor: false,
      representativeName: "",
      representativeNationalId: "",
      date: todayDate,
      reason: initialReason,
      bodyText: "",
      includeSignature: true,
    }
    base.bodyText = generateDefaultBodyText(base)
    return base
  })

  // PDF Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const previewUrlRef = useRef<string | null>(null)

  // Debounced form data to avoid rendering PDF on every keystroke
  const debouncedFormData = useDebounce(formData, 500)

  // 1. Fetch LabConfig on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "config", "lab")
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          const data = snapshot.data() as LabConfig
          setLabInfo(data)
          if (data.certificateReasons && data.certificateReasons.length > 0) {
            setPredefinedReasons(data.certificateReasons)
            setFormData((prev) => {
              // If current reason is default, use first from settings
              if (prev.reason === DEFAULT_REASONS[0] && data.certificateReasons![0]) {
                const next = { ...prev, reason: data.certificateReasons![0] }
                next.bodyText = generateDefaultBodyText(next)
                return next
              }
              return prev
            })
          }
        }
      } catch (err) {
        console.error("Error fetching lab config:", err)
      } finally {
        setLoadingConfig(false)
      }
    }
    fetchConfig()
  }, [])

  // 2. Generate PDF preview whenever debounced form data or labInfo changes
  useEffect(() => {
    let isCancelled = false

    const generatePreview = async () => {
      setIsGeneratingPreview(true)
      try {
        const docElement = (
          <CertificateDocument
            data={debouncedFormData}
            labInfo={labInfo}
          />
        )
        const blob = await pdf(docElement).toBlob()
        if (isCancelled) return

        // Revoke previous blob URL to prevent memory leaks
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
        }

        const newUrl = URL.createObjectURL(blob)
        previewUrlRef.current = newUrl
        setPreviewUrl(newUrl)
      } catch (err) {
        console.error("Error generating PDF preview:", err)
      } finally {
        if (!isCancelled) {
          setIsGeneratingPreview(false)
        }
      }
    }

    generatePreview()

    return () => {
      isCancelled = true
    }
  }, [debouncedFormData, labInfo])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  // 3. Reset form
  const handleResetForm = () => {
    const freshDate = getTodayString()
    const freshReason = predefinedReasons[0] || DEFAULT_REASONS[0]
    const resetData: CertificateData = {
      firstName: "",
      lastName: "",
      nationalId: "",
      age: "",
      isMinor: false,
      representativeName: "",
      representativeNationalId: "",
      date: freshDate,
      reason: freshReason,
      bodyText: "",
      includeSignature: true,
    }
    resetData.bodyText = generateDefaultBodyText(resetData)
    setFormData(resetData)
    toast.success("Formulario restablecido")
  }

  // 4. Download / Print PDF
  const handleDownloadPdf = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Por favor ingresa al menos nombre y apellido del paciente")
      return
    }

    setIsDownloading(true)
    try {
      const docElement = (
        <CertificateDocument
          data={formData}
          labInfo={labInfo}
        />
      )
      const blob = await pdf(docElement).toBlob()
      const downloadUrl = URL.createObjectURL(blob)

      const patientClean = `${formData.firstName}_${formData.lastName}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[/\\?%*:|"<>]/g, "")
        .replace(/\s+/g, "_")
        .toUpperCase()

      const fileName = `CONSTANCIA_${patientClean}_${formData.date}.pdf`

      // Trigger direct download
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Also open in a new tab for instant printing/viewing
      window.open(downloadUrl, "_blank")

      toast.success("Constancia PDF generada exitosamente")
    } catch (err) {
      console.error("Error generating PDF for download:", err)
      toast.error("Error al generar el archivo PDF")
    } finally {
      setIsDownloading(false)
    }
  }

  if (loadingConfig) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl py-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/20">
              <FileText className="h-5 w-5" />
            </div>
            Constancias y Justificativos
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Emite constancias de asistencia al laboratorio para pacientes o menores de edad en formato PDF al instante.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Modo Instantáneo (Sin Base de Datos)
          </span>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-6">
          <CertificateForm
            data={formData}
            onChange={setFormData}
            predefinedReasons={predefinedReasons}
            onGeneratePdf={handleDownloadPdf}
            onReset={handleResetForm}
            isGenerating={isDownloading}
          />
        </div>

        {/* Right Column: PDF Live Preview */}
        <div className="lg:col-span-6 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-white/10 bg-surface-900/60 p-4 shadow-xl backdrop-blur-sm space-y-3">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-semibold text-white">
                  Vista Previa del Documento
                </span>
                {isGeneratingPreview && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Loader2 className="h-3 w-3 animate-spin text-primary-400" />
                    Actualizando...
                  </span>
                )}
              </div>

              {previewUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(previewUrl, "_blank")}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
                    title="Abrir vista previa en nueva pestaña"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-glow-primary hover:bg-primary-500 transition disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Descargar
                  </button>
                </div>
              )}
            </div>

            {/* Preview Viewport / Iframe */}
            <div className="relative h-[640px] w-full overflow-hidden rounded-xl bg-surface-950 flex items-center justify-center border border-white/5">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="h-full w-full rounded-xl"
                  title="Vista Previa de la Constancia"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 text-center text-white/40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  <p className="text-sm">Generando vista previa del documento...</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/40 px-1 pt-1">
              <span>Formato: Carta (Letter) • Estilo membretado oficial</span>
              <span>Reutiliza membrete y firma autorizada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
