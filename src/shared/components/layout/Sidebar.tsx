import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import {
  FlaskConical,
  ClipboardList,
  History,
  BookOpen,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { APP_NAME } from "@/shared/lib/constants"

const navItems = [
  { to: "/orders/new", icon: ClipboardList, label: "Nueva Orden" },
  { to: "/orders",     icon: History,       label: "Historial" },
  { to: "/catalog",    icon: BookOpen,      label: "Catálogo" },
  { to: "/settings",   icon: Settings,      label: "Configuración" },
]

export default function Sidebar() {
  const { logOut } = useAuth()
  const navigate   = useNavigate()

  async function handleLogout() {
    await logOut()
    navigate("/login")
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/8 bg-surface-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 shadow-glow-primary">
          <FlaskConical className="h-5 w-5 text-white" strokeWidth={1.5} />
        </div>
        <span className="text-base font-bold tracking-tight text-white">{APP_NAME}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            id={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary-600/20 text-primary-300 shadow-glow-primary"
                  : "text-white/50 hover:bg-white/5 hover:text-white/90"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors",
                    isActive ? "text-primary-400" : "text-white/40 group-hover:text-white/70"
                  )}
                  strokeWidth={1.75}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-primary-400/60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/8 p-3">
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
