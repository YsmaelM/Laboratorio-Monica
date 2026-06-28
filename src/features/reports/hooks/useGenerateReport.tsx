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
          firstName: "María Altagracia",
          lastName: "González Pérez",
          birthDate: "1990-05-15",
          gender: "Femenino",
          phone: "809-555-0199",
          email: "maria.gonzalez@example.com"
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
              refRange: "4.0 - 5.6",
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
              refRange: "100 - 200",
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
              refRange: "35 - 150",
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
        await uploadBytes(storageRef, blob, { contentType: "application/pdf" })
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
