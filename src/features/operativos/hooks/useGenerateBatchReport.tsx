import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { collection, addDoc, setDoc, doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import { uploadReportSecurely } from "@/shared/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"
import { BatchReportDocument } from "../components/pdf/BatchReportDocument"
import { DualPageReportDocument } from "../components/pdf/DualPageReportDocument"
import type { LabConfig, BatchEntry, BatchOperation, TestEntry } from "@/shared/types"

// Helper para limpiar valores undefined recursivamente preservando Timestamps de Firestore
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return undefined
  if (obj instanceof Timestamp || obj instanceof Date) return obj
  if (Array.isArray(obj)) return obj.map(cleanUndefined)
  if (typeof obj === "object") {
    const cleaned: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key]
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val)
        }
      }
    }
    return cleaned
  }
  return obj
}

export function useGenerateBatchReport() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const saveBatch = async (
    name: string,
    templateTests: TestEntry[],
    entries: BatchEntry[],
    referringDoctor?: string,
    batchId?: string
  ): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)
    setProgress(10)

    try {
      const batchData: Omit<BatchOperation, "id"> = {
        name,
        templateTests,
        referringDoctor: referringDoctor?.trim() || undefined,
        entries,
        status: "completed",
        createdBy: user?.uid || "unknown",
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
      }

      setProgress(40)
      const cleanedData = cleanUndefined(batchData)

      if (batchId) {
        await setDoc(doc(db, "batch_operations", batchId), {
          ...cleanedData,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        setProgress(80)
        return batchId
      } else {
        const docRef = await addDoc(collection(db, "batch_operations"), {
          ...cleanedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setProgress(80)
        return docRef.id
      }
    } catch (err: any) {
      console.error("Error saving batch:", err)
      setError(err.message || "Error al guardar el operativo en la base de datos.")
      return null
    } finally {
      setIsGenerating(false)
      setProgress(100)
    }
  }

  const generateBatchPdf = async (
    entries: BatchEntry[],
    labInfo: LabConfig,
    layoutMode: "single" | "dual",
    referringDoctor?: string,
    batchId?: string
  ): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      let docElement: React.ReactElement<any>
      if (layoutMode === "dual") {
        docElement = (
          <DualPageReportDocument
            entries={entries}
            labInfo={labInfo}
            referringDoctor={referringDoctor}
          />
        )
      } else {
        docElement = (
          <BatchReportDocument
            entries={entries}
            labInfo={labInfo}
            referringDoctor={referringDoctor}
          />
        )
      }

      const blob = await pdf(docElement as any).toBlob()
      const localUrl = URL.createObjectURL(blob)

      if (batchId) {
        try {
          const now = new Date()
          const day = String(now.getDate()).padStart(2, "0")
          const month = String(now.getMonth() + 1).padStart(2, "0")
          const year = now.getFullYear()
          const dateStr = `${day}_${month}_${year}`

          const cleanBatchName = (labInfo.labName || "LOTE")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[/\\?%*:|"<>]/g, "")
            .replace(/\s+/g, '_')
            .toUpperCase()

          const downloadName = `OPERATIVO_${cleanBatchName}_${dateStr}.pdf`
          const fileName = `batch_reports/${batchId}/${downloadName}`

          const rawPdfUrl = await uploadReportSecurely(fileName, blob, downloadName)
          const pdfUrl = rawPdfUrl.includes("?t=") ? rawPdfUrl : `${rawPdfUrl}?t=${Date.now()}`

          // Guardar URL en el documento del batch
          await updateDoc(doc(db, "batch_operations", batchId), {
            pdfUrl
          })
          return pdfUrl
        } catch (uploadErr: any) {
          console.error("Supabase Storage upload failed for batch, falling back to local Blob URL:", uploadErr)
          setError(`Aviso: No se pudo guardar en Storage (${uploadErr.message || uploadErr}).`)
          return localUrl
        }
      }

      return localUrl
    } catch (err: any) {
      console.error("Error generating batch PDF:", err)
      setError(err.message || "Ocurrió un error al generar el PDF del operativo.")
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return { saveBatch, generateBatchPdf, isGenerating, progress, error }
}
