import { useState, useEffect, type FormEvent } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { LabConfig } from "@/shared/types"
import { Loader2, Save, Building2, FileSpreadsheet, FileText } from "lucide-react"
import toast from "react-hot-toast"
import GoogleSheetsImporter from "@/features/catalog/components/GoogleSheetsImporter"
import { useGenerateReport } from "@/features/reports/hooks/useGenerateReport"

export default function LabSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  
  const { generatePreviewPdf } = useGenerateReport()
  
  const [labName, setLabName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [footerText, setFooterText] = useState("")
  const [signatureUrl, setSignatureUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "config", "lab")
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          const data = snapshot.data() as LabConfig
          setLabName(data.labName || "")
          setAddress(data.address || "")
          setPhone(data.phone || "")
          setLicenseNumber(data.licenseNumber || "")
          setFooterText(data.footerText || "")
          setSignatureUrl(data.signatureUrl || "/firma.jpg")
          setLogoUrl(data.logoUrl || "")
        }
      } catch (err) {
        console.error("Error fetching lab config:", err)
        toast.error("Error al cargar la configuración")
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setter(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handlePreview = async () => {
    setIsPreviewing(true)
    try {
      const url = await generatePreviewPdf({
        labName,
        address,
        phone,
        licenseNumber,
        footerText,
        signatureUrl,
        logoUrl
      })
      if (url) {
        window.open(url, "_blank")
      } else {
        toast.error("No se pudo generar la vista previa")
      }
    } catch (err) {
      console.error("Error previewing report:", err)
      toast.error("Error al generar la vista previa")
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const docRef = doc(db, "config", "lab")
      await setDoc(docRef, {
        labName,
        address,
        phone,
        licenseNumber,
        footerText,
        signatureUrl,
        logoUrl,
      }, { merge: true })
      
      toast.success("Configuración guardada exitosamente")
    } catch (err) {
      console.error("Error saving lab config:", err)
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-6 space-y-10">
      {/* ── Lab Config ── */}
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-400" />
            Configuración del Laboratorio
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Esta información aparecerá en los encabezados y pies de página de los reportes PDF.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-6 shadow-xl backdrop-blur-sm sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-white/80">Nombre del Laboratorio *</label>
                <input
                  required
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-white/80">Dirección *</label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Teléfono *</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Número de Licencia / RNC</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-4">
                <label className="block text-sm font-medium text-white/80">Logo del Laboratorio (Opcional)</label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo del Laboratorio"
                      className="h-16 w-16 object-contain rounded-xl border border-white/10 bg-white/5 p-1"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setLogoUrl)}
                      className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-600/20 file:text-primary-400 hover:file:bg-primary-600/30 file:cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-white/40">Sube una imagen para el membrete de tus reportes PDF.</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-4">
                <label className="block text-sm font-medium text-white/80">Firma Digital (PNG con fondo transparente)</label>
                <div className="flex items-center gap-4">
                  {signatureUrl && (
                    <img
                      src={signatureUrl}
                      alt="Firma Digital"
                      className="h-16 w-32 object-contain rounded-xl border border-white/10 bg-white/5 p-1"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setSignatureUrl)}
                      className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-600/20 file:text-primary-400 hover:file:bg-primary-600/30 file:cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-white/40">Sube la firma que se insertará al final de los reportes PDF.</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-white/80">Texto del Pie de Página (Disclaimer)</label>
                <textarea
                  rows={3}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Ej. Resultados válidos solo si están firmados y sellados."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center gap-4">
              <button
                type="button"
                onClick={handlePreview}
                disabled={isPreviewing || saving}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-primary-400" />}
                {isPreviewing ? "Generando..." : "Generar Vista Previa"}
              </button>

              <button
                type="submit"
                disabled={saving || isPreviewing}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Google Sheets Importer ── */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            Importación de Catálogo
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Importa pruebas de formato simple (con valores de referencia y unidades) desde una hoja de Google Sheets pública.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface-900/50 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <GoogleSheetsImporter
            onImportDone={() => toast.success("¡Importación completada! Actualiza el catálogo para ver los cambios.")}
          />
        </div>
      </div>
    </div>
  )
}

