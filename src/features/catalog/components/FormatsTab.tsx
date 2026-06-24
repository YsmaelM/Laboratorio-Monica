import { Layout, Hammer } from "lucide-react"

export default function FormatsTab() {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-900 p-8 shadow-card text-center text-white/80 max-w-2xl mx-auto my-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-600/10 text-primary-400 mb-6">
        <Layout className="h-8 w-8 animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Constructor de Formatos Customizados</h3>
      <p className="text-sm text-white/60 mb-6 leading-relaxed">
        Diseña reportes estructurados a tu medida: añade filas vacías para espaciar, membretes para organizar secciones, y filas de pruebas con columnas custom y listas desplegables.
      </p>
      <div className="inline-flex items-center gap-2 rounded-xl bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-400 border border-primary-500/20 uppercase tracking-wider">
        <Hammer className="h-3.5 w-3.5" />
        Fase 4: Próximamente
      </div>
    </div>
  )
}
