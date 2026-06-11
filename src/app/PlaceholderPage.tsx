interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-2xl border border-white/10 bg-surface-900/60 px-10 py-12 shadow-card backdrop-blur">
        <div className="mb-3 text-4xl">🔬</div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-white/40">Módulo en construcción — próximamente disponible</p>
      </div>
    </div>
  )
}
