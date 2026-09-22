import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import { uploadReportSecurely } from "@/shared/lib/supabase"
import { ReportDocument } from "../components/ReportDocument"
import type { OrderResult, LabConfig } from "@/shared/types"

export function useGenerateReport() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFileName, setLastFileName] = useState<string | null>(null)

  const generatePreviewPdf = async (customLabInfo?: LabConfig): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      let labInfo: LabConfig
      if (customLabInfo) {
        labInfo = { ...customLabInfo }
      } else {
        const configDoc = await getDoc(doc(db, "config", "lab"))
        if (configDoc.exists()) {
          labInfo = configDoc.data() as LabConfig
        } else {
          labInfo = {
            labName: "Laboratorio Clínico de Ejemplo",
            address: "Dirección de Ejemplo",
            phone: "809-555-5555",
            signatureUrl: "/firma.jpg"
          }
        }
      }

      if (!labInfo.signatureUrl) {
        labInfo.signatureUrl = "/firma.jpg"
      }

      // Create a complete, nice sample order for the preview
      const sampleOrder: OrderResult = {
        id: "SAMPLE-123",
        patientId: "PAT-001",
        patientSnapshot: {
          patientId: "84695124",
          nationalId: "5165132",
          firstName: "María Altagracia",
          lastName: "González Pérez",
          dateOfBirth: Timestamp.now(),
          sex: "F",
        },
        orderDate: Timestamp.now(),
        status: "reported",
        referringDoctor: "Dr. Carlos Martínez",
        tests: [
          {
            catalogId: "hemoglobina_gluc",
            testName: "Hemoglobina Glicosilada (HbA1c)",
            format: "simple",
            status: "validated",
            data: {
              result: "5.8",
              unit: "%",
              refValue: "4.0 - 5.6",
              method: "Inmunoensayo cromatográfico",
              flag: "H"
            }
          },
          {
            catalogId: "colesterol_total",
            testName: "Colesterol Total",
            format: "simple",
            status: "validated",
            data: {
              result: "185",
              unit: "mg/dL",
              refValue: "100 - 200",
              method: "Enzimático colorimétrico",
              flag: "N"
            }
          },
          {
            catalogId: "trigliceridos",
            testName: "Triglicéridos",
            format: "simple",
            status: "validated",
            data: {
              result: "142",
              unit: "mg/dL",
              refValue: "35 - 150",
              method: "Enzimático colorimétrico",
              flag: "N"
            }
          }
        ],
        createdBy: "admin",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const blob = await pdf(<ReportDocument order={sampleOrder} labInfo={labInfo} />).toBlob()
      const localUrl = URL.createObjectURL(blob)
      return localUrl
    } catch (err: any) {
      console.error("Error generating preview PDF:", err)
      setError(err.message || "Ocurrió un error al generar la vista previa del PDF.")
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAndSavePdf = async (orderId: string, includeSignature: boolean = true): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      // 1. Fetch Order
      const orderDoc = await getDoc(doc(db, "orders_results", orderId))
      if (!orderDoc.exists()) throw new Error("La orden no existe.")
      const order = { id: orderDoc.id, ...orderDoc.data() } as OrderResult

      // 2. Fetch Lab Config
      const configDoc = await getDoc(doc(db, "config", "lab"))
      let labInfo: LabConfig
      if (configDoc.exists()) {
        labInfo = configDoc.data() as LabConfig
        if (!labInfo.signatureUrl) {
          labInfo.signatureUrl = "/firma.jpg"
        }
      } else {
        labInfo = {
          labName: "Laboratorio Clínico",
          address: "Dirección no configurada",
          phone: "Teléfono no configurado",
          signatureUrl: "/firma.jpg"
        }
      }

      if (!includeSignature) {
        labInfo.signatureUrl = ""
      }

      // 3. Generate PDF Blob
      const blob = await pdf(<ReportDocument order={order} labInfo={labInfo} />).toBlob()
      const localUrl = URL.createObjectURL(blob)

      // 4. Formatear y sanitizar nombre según el formato: Nombre_del_paciente_RESULTADO_FECHA
      let dateStr = "FECHA"
      try {
        const raw = order.orderDate
        let d: Date
        if (raw instanceof Timestamp) {
          d = raw.toDate()
        } else if (typeof raw === "object" && raw !== null && "seconds" in raw) {
          d = new Date((raw as any).seconds * 1000)
        } else if (raw) {
          d = new Date(raw as any)
        } else {
          d = new Date()
        }

        const day = String(d.getDate()).padStart(2, "0")
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const year = d.getFullYear()
        dateStr = `${day}_${month}_${year}`
      } catch (dateErr) {
        console.error("Error formatting date for filename:", dateErr)
      }

      const firstName = (order.patientSnapshot?.firstName || "").trim()
      const lastName = (order.patientSnapshot?.lastName || "").trim()
      const fullName = `${firstName} ${lastName}`.trim() || "PACIENTE"

      // Sanitizar removiendo acentos y caracteres prohibidos en rutas y sistemas de archivos
      const patientNameClean = fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[/\\?%*:|"<>]/g, "")
        .replace(/\s+/g, "_")
        .toUpperCase()

      const downloadName = `${patientNameClean}_RESULTADO_${dateStr}.pdf`
      setLastFileName(downloadName)

      const patientFolder = order.patientId || order.patientSnapshot?.patientId || "pacientes"
      const fileName = `${patientFolder}/${orderId}/${downloadName}`

      try {
        // 5. Subir a Supabase Storage mediante Edge Function Segura (con fallback directo)
        const rawPdfUrl = await uploadReportSecurely(fileName, blob, downloadName)
        const pdfUrl = rawPdfUrl.includes("?t=") ? rawPdfUrl : `${rawPdfUrl}?t=${Date.now()}`

        // 6. Actualizar Orden en Firestore con la URL persistente de Supabase
        await updateDoc(doc(db, "orders_results", orderId), {
          pdfUrl,
          status: "reported",
        })

        return pdfUrl
      } catch (uploadErr: any) {
        console.error("Supabase Storage upload error:", uploadErr)
        setError(`Aviso: El archivo no se pudo guardar en Storage (${uploadErr.message || uploadErr}).`)

        // En caso de fallo crítico en storage, actualizamos el estado para no bloquear el flujo pero guardamos el localUrl
        try {
          await updateDoc(doc(db, "orders_results", orderId), {
            status: "reported"
          })
        } catch (dbErr) {
          console.error("Failed to update order status in Firestore:", dbErr)
        }

        return localUrl
      }
    } catch (err: any) {
      console.error("Error generating PDF:", err)
      setError(err.message || "Ocurrió un error al generar el PDF.")
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return { generateAndSavePdf, generatePreviewPdf, isGenerating, error, lastFileName }
}
