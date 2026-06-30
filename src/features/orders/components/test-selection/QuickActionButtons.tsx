import type { TestCatalogItem } from "@/shared/types"
import { Activity, Droplets, TestTube, FlaskConical, Syringe, LineSquiggle, ClockFading, Bubbles, Layout } from "lucide-react"

interface QuickActionButtonsProps {
  catalog: TestCatalogItem[]
  onSelect: (item: TestCatalogItem) => void
}

export default function QuickActionButtons({ catalog, onSelect }: QuickActionButtonsProps) {
  const quickActions = catalog.filter(item => item.isQuickAction)

  const getIcon = (category: string) => {
    switch (category) {
      case "Hematologia": return <Syringe className="h-6 w-6 text-red-400" />
      case "Uroanalisis": return <Droplets className="h-6 w-6 text-yellow-400" />
      case "Coproanalisis": return <LineSquiggle className="h-6 w-6 text-amber-700" />
      case "Bacteriologia": return <Bubbles className="h-6 w-6 text-emerald-400" />
      case "Tiempo de coagulacion": return <ClockFading className="h-6 w-6 text-purple-400" />
      case "Quimica": return <TestTube className="h-6 w-6 text-purple-400" />
      case "Custom": return <FlaskConical className="h-6 w-6 text-purple-400" />
      case "Perfiles": return <Layout className="h-6 w-6 text-purple-400" />
      default: return <Activity className="h-6 w-6" />
    }
  }

  if (quickActions.length === 0) return null

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-sm font-medium text-white/60">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickActions.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-surface-800 p-4 transition hover:border-primary-500/50 hover:bg-primary-500/10 hover:shadow-glow-primary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 transition group-hover:bg-white/10 group-hover:text-primary-400">
              {getIcon(item.category)}
            </div>
            <span className="text-center text-sm font-medium text-white/80 group-hover:text-white">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
