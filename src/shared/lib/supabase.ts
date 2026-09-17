import { createClient } from "@supabase/supabase-js"
import { auth, storage } from "@/shared/lib/firebase"
import { ref, deleteObject } from "firebase/storage"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Sube un reporte PDF a Supabase Storage.
 * Utiliza la Edge Function 'upload-report' con autenticación dual (Supabase Gateway + Firebase Token)
 * y cuenta con fallback a subida directa si la Edge Function no responde.
 */
export async function uploadReportSecurely(path: string, blob: Blob, filename?: string): Promise<string> {
  const currentUser = auth.currentUser
  const token = currentUser ? await currentUser.getIdToken() : ""

  const formData = new FormData()
  formData.append("file", blob, filename || "report.pdf")
  formData.append("path", path)

  const functionUrl = `${supabaseUrl}/functions/v1/upload-report`
  let functionError: Error | null = null

  try {
    const res = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
        ...(token ? { "x-firebase-token": token } : {}),
      },
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      if (data.publicUrl) {
        return data.publicUrl
      }
    } else {
      const errData = await res.json().catch(() => ({}))
      functionError = new Error(errData.error || errData.message || `HTTP ${res.status} en Edge Function`)
      console.warn("Edge Function de subida falló:", functionError.message)
    }
  } catch (err: any) {
    functionError = err
    console.warn("Error de conexión con la Edge Function:", err)
  }

  // Fallback: Intento de subida directa a Supabase Storage con cliente JS
  try {
    console.log("Intentando subida directa de respaldo a Supabase Storage:", path)
    const { error: directUploadError } = await supabase.storage
      .from("reports")
      .upload(path, blob, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      })

    if (!directUploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from("reports")
        .getPublicUrl(path)

      if (publicUrl) {
        console.log("Subida directa exitosa a Supabase Storage:", publicUrl)
        return publicUrl
      }
    } else {
      console.warn("Subida directa a Supabase Storage falló:", directUploadError.message)
    }
  } catch (directErr) {
    console.warn("Excepción en subida directa a Supabase Storage:", directErr)
  }

  throw functionError || new Error("No se pudo guardar el archivo en el Storage de Supabase.")
}

/**
 * Elimina un reporte del almacenamiento físico, detectando automáticamente
 * si pertenece a Supabase Storage o al anterior Firebase Storage.
 */
export async function deleteReportFromStorage(url: string): Promise<boolean> {
  if (!url) return false

  try {
    // 1. Supabase Storage
    if (url.includes("/storage/v1/object/public/reports/")) {
      const parts = url.split("/storage/v1/object/public/reports/")
      if (parts[1]) {
        const filePath = decodeURIComponent(parts[1].split("?")[0])
        const { error } = await supabase.storage.from("reports").remove([filePath])
        if (error) {
          console.warn("No se pudo eliminar de Supabase Storage:", error.message)
          return false
        }
        console.log("Archivo eliminado de Supabase Storage:", filePath)
        return true
      }
    }

    // 2. Firebase Storage (compatibilidad con órdenes anteriores)
    if (url.includes("firebasestorage.app") || url.includes("/o/")) {
      const decodedUrl = decodeURIComponent(url)
      const pathStart = decodedUrl.indexOf("/o/") + 3
      const pathEnd = decodedUrl.indexOf("?alt=media")
      const storagePath = pathEnd !== -1 
        ? decodedUrl.substring(pathStart, pathEnd)
        : decodedUrl.substring(pathStart)

      if (storagePath) {
        const fileRef = ref(storage, storagePath)
        await deleteObject(fileRef)
        console.log("Archivo eliminado de Firebase Storage:", storagePath)
        return true
      }
    }
  } catch (err) {
    console.warn("Error al intentar eliminar archivo físico de Storage:", err)
  }

  return false
}
