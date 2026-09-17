import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-firebase-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const FIREBASE_API_KEY = Deno.env.get("FIREBASE_API_KEY") || "AIzaSyDaFQnhriRJ4VCh8gw4VWfK40JhQtoN_js"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 1. Verify Firebase ID Token
    // Soportar x-firebase-token (cuando Kong verifica JWT de Supabase en Authorization)
    // o Authorization: Bearer <firebaseToken> (cuando la verificación de JWT está desactivada en la función)
    let idToken = req.headers.get("x-firebase-token")?.trim()
    const authHeader = req.headers.get("Authorization")

    if (!idToken && authHeader && authHeader.startsWith("Bearer ")) {
      const candidate = authHeader.split("Bearer ")[1]?.trim()
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
      if (candidate && candidate !== anonKey) {
        idToken = candidate
      }
    }

    if (!idToken) {
      return new Response(JSON.stringify({ error: "Missing or invalid Firebase session token (x-firebase-token)" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 2. Validate Firebase Token with Google API
    if (FIREBASE_API_KEY) {
      const googleRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      )

      if (!googleRes.ok) {
        const errData = await googleRes.json()
        console.error("Firebase token validation failed:", errData)
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid Firebase session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    // 3. Parse FormData
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const filePath = formData.get("path") as string | null

    if (!file || !filePath) {
      return new Response(JSON.stringify({ error: "Missing 'file' or 'path' in formData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 4. Initialize Supabase Admin Client using Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Supabase environment variables missing on server" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 5. Upload file using admin privileges (bypasses RLS)
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from("reports")
      .upload(filePath, uint8Array, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 6. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("reports")
      .getPublicUrl(filePath)

    return new Response(JSON.stringify({ publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("Edge function error:", err)
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
