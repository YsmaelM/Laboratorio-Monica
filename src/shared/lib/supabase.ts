import { createClient } from "@supabase/supabase-js"
import { auth, storage } from "@/shared/lib/firebase"
import { ref, deleteObject } from "firebase/storage"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Advertencia: Variables de entorno de Supabase no configuradas (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)")
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
)

/**
 * Sube un reporte PDF a Supabase Storage.
 * Utiliza la Edge Function 'upload-report' con autenticación dual (Supabase Gateway + Firebase Token)
 * y cuenta con fallback a subida directa si la Edge Function no responde.
 */
export async function uploadReportSecurely(path: string, blob: Blob, filename?: string): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no detectadas. En Vercel debes hacer un 'Redeploy' tras agregar las variables de entorno para que se apliquen al bundle.")
  }

  const currentUser = auth.currentUser
  const token = currentUser ? await currentUser.getIdToken() : ""

  const formData = new FormData()
  formData.append("file", blob, filename || "report.pdf")
  formData.append("path", path)

  let functionError: Error | null = null

  // 1. Invocar mediante SDK oficial de Supabase
  try {
    const { data, error } = await supabase.functions.invoke("upload-report", {
      body: formData,
      headers: {
        ...(token ? { "x-firebase-token": token } : {}),
      },
    })

    if (!error && data?.publicUrl) {
      return data.publicUrl
    }

    if (error) {
      functionError = new Error(error.message || "Error al subir reporte a Edge Function")
      console.warn("supabase.functions.invoke error:", error)
    }
  } catch (invokeErr: any) {
    functionError = invokeErr
    console.warn("Excepción al invocar Edge Function:", invokeErr)
  }

  // 2. Fallback con llamada fetch directa al endpoint de la función
  try {
    const functionUrl = `${supabaseUrl}/functions/v1/upload-report`
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
      console.warn("Fetch fallback falló:", functionError.message)
    }
  } catch (fetchErr: any) {
    functionError = fetchErr
    console.warn("Fetch fallback excepción:", fetchErr)
  }

  // 3. Fallback directo a Supabase Storage con cliente JS
  try {
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
        return publicUrl
      }
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
