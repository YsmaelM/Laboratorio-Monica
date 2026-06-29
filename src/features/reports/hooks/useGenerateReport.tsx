import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore"
import { db, storage } from "@/shared/lib/firebase"
import { ReportDocument } from "../components/ReportDocument"
import type { OrderResult, LabConfig } from "@/shared/types"

export function useGenerateReport() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        // Fallback lab info
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
      try {
        // 4. Upload to Firebase Storage
        const fileName = `reports/${order.patientId}/${orderId}_${Date.now()}.pdf`
        const storageRef = ref(storage, fileName)

        // 1. Convertir y formatear la fecha de la orden de forma segura (DD_MM_AAAA)
        let dateStr = "FECHA"
        try {
          const raw = order.orderDate
          let d: Date
          if (raw instanceof Timestamp) {
            d = raw.toDate()
          } else if (typeof raw === "object" && raw !== null && "seconds" in raw) {
            d = new Date((raw as any).seconds * 1000)
          } else {
            d = new Date(raw as any)
          }

          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          dateStr = `${day}_${month}_${year}`
        } catch (dateErr) {
          console.error("Error formatting date for filename:", dateErr)
        }

        // 2. Sanitizar el nombre del paciente
        const patientNameClean = `${order.patientSnapshot.firstName}_${order.patientSnapshot.lastName}`
          .replace(/\s+/g, '_')
          .toUpperCase();

        // 3. Unir todo en el formato final solicitado
        const downloadName = `RESULTADO_${patientNameClean}_${dateStr}.pdf`;

        // 4. Configurar la metadata con las cabeceras de descarga
        const metadata = {
          contentType: "application/pdf",
          contentDisposition: `inline; filename="${downloadName}"`
        };

        // 5. Subir a Firebase Storage
        await uploadBytes(storageRef, blob, metadata)
        const pdfUrl = await getDownloadURL(storageRef)

        // 5. Update Order Document
        await updateDoc(doc(db, "orders_results", orderId), {
          pdfUrl,
          status: "reported",
        })

        return pdfUrl


      } catch (uploadErr: any) {
        console.warn("Firebase Storage upload failed (CORS/Permissions). Falling back to local Blob URL:", uploadErr)

        // Update Firestore status to reported even if the PDF file upload failed
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

  return { generateAndSavePdf, generatePreviewPdf, isGenerating, error }
}
