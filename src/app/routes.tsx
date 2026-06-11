import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import MainLayout from "@/shared/components/layout/MainLayout"
import { Loader2 } from "lucide-react"

// Lazy-loaded pages
const LoginPage       = lazy(() => import("@/features/auth/pages/LoginPage"))
const PlaceholderPage = lazy(() => import("@/app/PlaceholderPage"))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user)   return <Navigate to="/login" replace />
  return <>{children}</>
}

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-950">
      <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout>
                <Routes>
                  <Route index element={<Navigate to="/orders/new" replace />} />
                  <Route path="orders/new" element={<PlaceholderPage title="Nueva Orden" />} />
                  <Route path="orders"     element={<PlaceholderPage title="Historial de Órdenes" />} />
                  <Route path="catalog"    element={<PlaceholderPage title="Catálogo de Pruebas" />} />
                  <Route path="settings"   element={<PlaceholderPage title="Configuración" />} />
                  <Route path="*"          element={<Navigate to="/orders/new" replace />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}
