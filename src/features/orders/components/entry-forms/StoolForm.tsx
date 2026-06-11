import { useState } from "react"
import type { StoolEntry } from "@/shared/types"

interface StoolFormProps {
  entry: StoolEntry
  onChange: (updated: StoolEntry) => void
}

const MACRO_LABELS: Record<string, string> = {
  color: "Color", consistency: "Consistencia", mucus: "Moco", blood: "Sangre Macroscópica",
}
const MICRO_LABELS: Record<string, string> = {
  parasites: "Parásitos", leukocytes: "Leucocitos", erythrocytes: "Eritrocitos", fat: "Grasa / Jabones",
}
const CHEM_LABELS: Record<string, string> = {
  ph: "pH", occult_blood: "Sangre Oculta",
}

const TABS = [
  { key: "macroscopic", label: "Macroscópico" },
  { key: "microscopic", label: "Microscópico" },
  { key: "chemical", label: "Químico" },
] as const

type TabKey = typeof TABS[number]["key"]

function getLabelMap(tab: TabKey) {
  if (tab === "macroscopic") return MACRO_LABELS
  if (tab === "microscopic") return MICRO_LABELS
  return CHEM_LABELS
}

export default function StoolForm({ entry, onChange }: StoolFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("macroscopic")

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

  // Check if a field is the parasites textarea
  const isTextarea = (key: string) => key === "parasites"

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
          <div key={key} className={isTextarea(key) ? "sm:col-span-2" : ""}>
            <label className="mb-1 block text-xs font-medium text-white/60">
              {labels[key] || key}
            </label>
            {isTextarea(key) ? (
              <textarea
                value={value}
                onChange={(e) => updateField(key, e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
