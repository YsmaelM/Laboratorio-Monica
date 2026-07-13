import { useState, useEffect, type FormEvent } from "react"
import { useAuth } from "@/app/providers/AuthProvider"
import { useNavigate } from "react-router-dom"
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true })
    }
  }, [user, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err?.message || "Credenciales incorrectas. Verifique su correo y contraseña.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary-700/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent-700/15 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-surface-900/80 p-8 shadow-card backdrop-blur-xl">
          {/* Logo / Header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 shadow-glow-primary">
              <img src="public\favicon.svg" alt="LabSys" className="h-10 w-10" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">LabSys</h1>
              <p className="mt-1 text-sm text-white/50">Sistema de Resultados de Laboratorio</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-white/60 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@laboratorio.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-white/60 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 py-3 text-sm font-semibold text-white shadow-glow-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/25">
          © {new Date().getFullYear()} LabSys · Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  )
}
