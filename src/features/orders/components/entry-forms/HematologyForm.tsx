import type { HematologyEntry, HematologyResultRow } from "@/shared/types"

interface HematologyFormProps {
  entry: HematologyEntry
  onChange: (updated: HematologyEntry) => void
}

export default function HematologyForm({ entry, onChange }: HematologyFormProps) {
  const { data } = entry

  const updateRow = (sectionIdx: number, rowIdx: number, field: keyof HematologyResultRow, value: string | number) => {
    const newSections = data.sections.map((section, si) => {
      if (si !== sectionIdx) return section
      return {
        ...section,
        results: section.results.map((row, ri) => {
          if (ri !== rowIdx) return row
          return { ...row, [field]: value }
        }),
      }
    })

    onChange({
      ...entry,
      status: "entered",
      data: { ...data, sections: newSections },
    })
  }

  const updateSmearNotes = (notes: string) => {
    onChange({
      ...entry,
      status: "entered",
      data: { ...data, smearNotes: notes },
    })
  }

  return (
    <div className="space-y-6">
      {data.sections.map((section, sectionIdx) => (
        <div key={section.sectionName}>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-400">
            <div className="h-1 w-1 rounded-full bg-primary-400" />
            {section.sectionName}
          </h4>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/60">
                  <th className="px-4 py-2.5 text-left font-medium">Parámetr</th>
                  <th className="px-4 py-2.5 text-left font-medium w-32">Resultado</th>
                  <th className="px-4 py-2.5 text-left font-medium w-24">Unidad</th>
                  <th className="px-4 py-2.5 text-left font-medium w-36">Rango Ref.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {section.results.map((row, rowIdx) => (
                  <tr key={row.key} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/80 font-medium">{row.label}</td>
                    <td className="px-4 py-1.5">
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => updateRow(sectionIdx, rowIdx, "value", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => updateRow(sectionIdx, rowIdx, "unit", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-1.5">
                      <input
                        type="text"
                        value={row.refRange}
                        onChange={(e) => updateRow(sectionIdx, rowIdx, "refRange", e.target.value)}
                        placeholder="Ej: 4.5 - 5.9"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/50 placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Peripheral Smear Notes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/60">
          Notas de Frotis Periférico (Opcional)
        </label>
        <textarea
          value={data.smearNotes || ""}
          onChange={(e) => updateSmearNotes(e.target.value)}
          rows={3}
          placeholder="Observaciones del frotis periférico..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </div>
  )
}
