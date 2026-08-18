import type { TestEntry } from "@/shared/types"

interface BulkResultApplierProps {
  templateTests: TestEntry[]
  onApply: (tests: TestEntry[]) => void
}

export default function BulkResultApplier({ templateTests, onApply }: BulkResultApplierProps) {
  const handleValueChange = (catalogId: string, value: string) => {
    const updated = templateTests.map((t) => {
      if (t.catalogId === catalogId) {
        if (t.format === "simple") {
          return {
            ...t,
            data: {
              ...t.data,
              result: value,
            },
          }
        }
        if (t.format === "custom") {
          const dataCopy = { ...t.data }
          const template = t.customTemplate
          if (template?.rows) {
            template.rows.forEach((row) => {
              if (row.type === "test" || row.type === "simple") {
                row.columns.forEach((col) => {
                  if (
                    !col.isHeaderOnly &&
                    !col.isFixed &&
                    col.type !== "formula" &&
                    col.type !== "reference" &&
                    col.type !== "unit"
                  ) {
                    dataCopy[`${row.id}|${col.id}`] = value
                  }
                })
              }
            })
          }
          return { ...t, data: dataCopy }
        }
        if (t.format === "culture") {
          return {
            ...t,
            data: {
              ...t.data,
              cultureResult: value,
              sampleType: "Sangre",
            },
          }
        }
      }
      return t
    })
    onApply(updated)
  }

  if (templateTests.length === 0) return null

  return (
    <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 mb-6">
      <h4 className="text-sm font-semibold text-primary-300 mb-2">Resultados Rápidos (Aplicar a todos los pacientes)</h4>
      <div className="flex flex-wrap gap-4 items-end">
        {templateTests.map((test) => (
          <div key={test.catalogId} className="flex flex-col">
            <label className="text-xs text-white/60 mb-1">{test.testName} ({test.format})</label>
            <div className="flex gap-2">
              <select
                onChange={(e) => handleValueChange(test.catalogId, e.target.value)}
                defaultValue=""
                className="rounded-lg border border-white/10 bg-surface-950 px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
              >
                <option value="">Seleccionar resultado...</option>
                <option value="No Reactivo">No Reactivo</option>
                <option value="Reactivo">Reactivo</option>
                <option value="Negativo">Negativo</option>
                <option value="Positivo">Positivo</option>
              </select>
              <input
                type="text"
                placeholder="U otro valor..."
                onChange={(e) => handleValueChange(test.catalogId, e.target.value)}
                className="rounded-lg border border-white/10 bg-surface-950 px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500 w-36"
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-white/40 italic self-center">
          * Al seleccionar una opción o escribir, se llenará este resultado para todos los pacientes y marcará su estado como Completo.
        </p>
      </div>
    </div>
  )
}
