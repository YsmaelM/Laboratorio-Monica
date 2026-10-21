import { useState } from "react"
import {
  RotateCcw,
  Printer,
  Loader2,
  Calendar,
  User,
  PencilLine
} from "lucide-react"
import type { CertificateData, Patient } from "@/shared/types"
import PatientSearchSection from "./PatientSearchSection"

interface CertificateFormProps {
  data: CertificateData
  onChange: (newData: CertificateData) => void
  predefinedReasons: string[]
  onGeneratePdf: () => void
  onReset: () => void
  isGenerating?: boolean
}

export const generateDefaultBodyText = (data: Partial<CertificateData>): string => {
  const firstName = data.firstName?.trim() || "___________"
  const lastName = data.lastName?.trim() || "___________"
  const fullName = `${firstName} ${lastName}`.trim()

  // Format date to DD/MM/YYYY
  let formattedDate = "___________"
  if (data.date) {
    try {
      const parts = data.date.split("-")
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    } catch {
      formattedDate = data.date
    }
  }

  const reason = data.reason?.trim() || "se realizó pruebas de laboratorio"

  if (data.isMinor) {
    const ageStr = data.age ? ` de ${data.age} años` : ""
    let repStr = ""
    if (data.representativeName?.trim()) {
      const repIdStr = data.representativeNationalId?.trim()
        ? ` de cédula V- ${data.representativeNationalId.trim()}`
        : ""
      repStr = `, representado(a) por ${data.representativeName.trim()}${repIdStr}`
    }

    return `Por medio de la presente se hace conocer a quien le sea de interés que el/la paciente ${fullName}, menor de edad${ageStr}${repStr}, ${reason} el día ${formattedDate}.`
  }

  const idStr = data.nationalId?.trim() ? `V- ${data.nationalId.trim()}` : "sin cédula registrada"
  return `Por medio de la presente se hace conocer a quien le sea de interés que el/la paciente ${fullName}  de cédula ${idStr}, ${reason} el día ${formattedDate}.`
}

export default function CertificateForm({
  data,
  onChange,
  predefinedReasons,
  onGeneratePdf,
  onReset,
  isGenerating = false,
}: CertificateFormProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isCustomReason, setIsCustomReason] = useState(false)
  const [customReasonText, setCustomReasonText] = useState("")
  const [isManualTextEdit, setIsManualTextEdit] = useState(false)

  // Handle patient selected from search
  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient)
    if (patient) {
      const isMinorCalc = patient.age !== undefined ? Number(patient.age) < 18 : false
      const updated: CertificateData = {
        ...data,
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        nationalId: patient.nationalId || "",
        age: patient.age !== undefined ? patient.age : "",
        isMinor: isMinorCalc,
      }
      if (!isManualTextEdit) {
        updated.bodyText = generateDefaultBodyText(updated)
      }
      onChange(updated)
    }
  }

  // Update a single field
  const updateField = <K extends keyof CertificateData>(key: K, value: CertificateData[K]) => {
    const updated = { ...data, [key]: value }

    // If body text was not manually edited by the user, keep it in sync with field changes
    if (!isManualTextEdit && key !== "bodyText") {
      updated.bodyText = generateDefaultBodyText(updated)
    }

    onChange(updated)
  }

  // Reason selector change handler
  const handleReasonSelect = (value: string) => {
    if (value === "__custom__") {
      setIsCustomReason(true)
      updateField("reason", customReasonText || "asistió al laboratorio")
    } else {
      setIsCustomReason(false)
      updateField("reason", value)
    }
  }

  // Custom reason text change
  const handleCustomReasonChange = (val: string) => {
    setCustomReasonText(val)
    updateField("reason", val)
  }

  // Reset body text to auto-generated template
  const handleResetBodyText = () => {
    setIsManualTextEdit(false)
    const newText = generateDefaultBodyText(data)
    updateField("bodyText", newText)
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Buscador de Paciente ── */}
      <PatientSearchSection
        selectedPatient={selectedPatient}
        onPatientSelect={handlePatientSelect}
      />

      {/* ── 2. Datos del Paciente ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <User className="h-4 w-4 text-primary-400" />
          Datos del Paciente
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Nombres */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Nombre *</label>
            <input
              type="text"
              required
              value={data.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="Ej. Omardit"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Apellidos */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Apellido *</label>
            <input
              type="text"
              required
              value={data.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Ej. Blanco"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Toggle Menor de Edad */}
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div>
              <span className="text-sm font-medium text-white">¿Es menor de edad?</span>
              <p className="text-xs text-white/50">
                Habilita los campos de representante y hace la cédula opcional
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={data.isMinor}
                onChange={(e) => updateField("isMinor", e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
            </label>
          </div>

          {/* Cédula */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">
              {data.isMinor ? "Cédula del Menor (Opcional)" : "Cédula *"}
            </label>
            <input
              type="text"
              value={data.nationalId || ""}
              onChange={(e) => updateField("nationalId", e.target.value)}
              placeholder="Ej. 28.464.803"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Edad */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Edad (años)</label>
            <input
              type="number"
              min="0"
              max="125"
              value={data.age || ""}
              onChange={(e) => updateField("age", e.target.value ? Number(e.target.value) : "")}
              placeholder="Ej. 25"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Representante (si es menor) */}
          {data.isMinor && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-amber-300/90">
                  Nombre del Representante *
                </label>
                <input
                  type="text"
                  value={data.representativeName || ""}
                  onChange={(e) => updateField("representativeName", e.target.value)}
                  placeholder="Ej. Carmen Blanco"
                  className="w-full rounded-xl border border-amber-500/30 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-amber-300/90">
                  Cédula del Representante *
                </label>
                <input
                  type="text"
                  value={data.representativeNationalId || ""}
                  onChange={(e) => updateField("representativeNationalId", e.target.value)}
                  placeholder="Ej. 14.234.567"
                  className="w-full rounded-xl border border-amber-500/30 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 3. Datos de la Constancia ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary-400" />
          Detalles de la Constancia
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Fecha */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Fecha de Asistencia *</label>
            <input
              type="date"
              required
              value={data.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Selector de Motivo */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Motivo Predefinido</label>
            <select
              value={isCustomReason ? "__custom__" : data.reason}
              onChange={(e) => handleReasonSelect(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-900 px-3.5 py-2 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {predefinedReasons.map((reason, idx) => (
                <option key={idx} value={reason} className="bg-surface-900 text-white">
                  {reason}
                </option>
              ))}
              <option value="__custom__" className="bg-surface-900 text-primary-300 font-semibold">
                ✏️ Otro (Escribir personalizado...)
              </option>
            </select>
          </div>

          {/* Motivo personalizado (si está seleccionado) */}
          {isCustomReason && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-primary-300">
                Motivo Personalizado *
              </label>
              <input
                type="text"
                value={customReasonText}
                onChange={(e) => handleCustomReasonChange(e.target.value)}
                placeholder="Ej. se le practicó toma de muestra sanguínea para descarte"
                className="w-full rounded-xl border border-primary-500/40 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Toggle Firma Autorizada */}
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div>
              <span className="text-sm font-medium text-white">Incluir Firma Autorizada</span>
              <p className="text-xs text-white/50">
                Muestra la firma digitalizada del bioanalista configurado en el pie de página
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={data.includeSignature}
                onChange={(e) => updateField("includeSignature", e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
            </label>
          </div>
        </div>

        {/* ── 4. Texto Editable de la Constancia ── */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
              <PencilLine className="h-3.5 w-3.5 text-primary-400" />
              Contenido del Párrafo de la Constancia
              {isManualTextEdit && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  Texto personalizado
                </span>
              )}
            </label>

            <button
              type="button"
              onClick={handleResetBodyText}
              className="flex items-center gap-1 text-[11px] text-primary-400 hover:text-primary-300 transition"
              title="Volver a generar el texto automáticamente con los campos del formulario"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer automático
            </button>
          </div>

          <textarea
            rows={4}
            value={data.bodyText}
            onChange={(e) => {
              setIsManualTextEdit(true)
              updateField("bodyText", e.target.value)
            }}
            placeholder="Texto del cuerpo de la constancia..."
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm text-white leading-relaxed placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <p className="mt-1 text-[11px] text-white/40">
            Puedes editar libremente este texto antes de generar el PDF. Si cambias los datos del paciente o motivo, puedes pulsar "Restablecer automático".
          </p>
        </div>
      </div>

      {/* ── 5. Botones de Acción ── */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setSelectedPatient(null)
            setIsManualTextEdit(false)
            onReset()
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar Formulario
        </button>

        <button
          type="button"
          onClick={onGeneratePdf}
          disabled={isGenerating || !data.firstName.trim() || !data.lastName.trim()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow-primary transition hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Descargar / Imprimir PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
