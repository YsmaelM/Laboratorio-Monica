import { BrowserRouter } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/app/providers/AuthProvider"
import AppRoutes from "@/app/routes"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#334155',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
