import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import MainLayout from "@/shared/components/layout/MainLayout"
import { Loader2 } from "lucide-react"
import NotFound from "@/app/NotFound"

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"))
const OrderWorkflowPage = lazy(() => import("@/features/orders/pages/OrderWorkflowPage"))
const OrderHistoryPage = lazy(() => import("@/features/orders/pages/OrderHistoryPage"))
const LabSettingsPage = lazy(() => import("@/features/settings/pages/LabSettingsPage"))
const PatiensListPage = lazy(() => import("@/features/patients/components/PatiensListPage"))
const CatalogManagementPage = lazy(() => import("@/features/catalog/pages/CatalogManagementPage"))



function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace />
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
                  <Route index element={<Navigate to="newOrder" replace />} />
                  <Route path="newOrder" element={<OrderWorkflowPage />} />
                  <Route path="orders" element={<OrderHistoryPage />} />
                  <Route path="catalog" element={<CatalogManagementPage />} />
                  <Route path="settings" element={<LabSettingsPage />} />
                  <Route path="patiens" element={<PatiensListPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}
