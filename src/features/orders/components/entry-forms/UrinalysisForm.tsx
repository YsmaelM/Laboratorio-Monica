import { useState } from "react"
import type { UrinalysisEntry } from "@/shared/types"

interface UrinalysisFormProps {
  entry: UrinalysisEntry
  onChange: (updated: UrinalysisEntry) => void
}

// Labels for each section's keys (Spanish)
const PHYSICAL_LABELS: Record<string, string> = {
  color: "Color", aspect: "Aspecto", density: "Densidad",
}
const CHEMICAL_LABELS: Record<string, string> = {
  ph: "pH", protein: "Proteínas", glucose: "Glucosa", ketones: "Cetonas",
  blood: "Sangre Oculta", bilirubin: "Bilirrubina", urobilinogen: "Urobilinógeno",
  nitrite: "Nitritos", leukocyte_esterase: "Esterasa Leucocitaria",
}
const MICROSCOPIC_LABELS: Record<string, string> = {
  leukocytes_micro: "Leucocitos", erythrocytes_micro: "Eritrocitos",
  epithelial_cells: "Células Epiteliales", bacteria: "Bacterias",
  crystals: "Cristales", casts: "Cilindros",
}

const TABS = [
  { key: "physical", label: "Físico" },
  { key: "chemical", label: "Químico" },
  { key: "microscopic", label: "Microscópico" },
] as const

type TabKey = typeof TABS[number]["key"]

function getLabelMap(tab: TabKey) {
  if (tab === "physical") return PHYSICAL_LABELS
  if (tab === "chemical") return CHEMICAL_LABELS
  return MICROSCOPIC_LABELS
}

export default function UrinalysisForm({ entry, onChange }: UrinalysisFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("physical")

  const currentData = entry.data[activeTab]
  const labels = getLabelMap(activeTab)

  const updateField = (key: string, value: string) => {
    onChange({
      ...entry,
      status: "entered",
      data: {
        ...entry.data,
        [activeTab]: { ...currentData, [key]: value },
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-surface-800 p-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-primary-600/20 text-primary-300 shadow-sm"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(currentData).map(([key, value]) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-white/60">
              {labels[key] || key}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
