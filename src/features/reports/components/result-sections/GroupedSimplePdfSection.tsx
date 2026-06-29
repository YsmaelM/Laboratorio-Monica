import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { SimpleTestEntry, ReferenceValue } from "@/shared/types"

interface GroupedSimplePdfSectionProps {
  entries: SimpleTestEntry[]
}

export function GroupedSimplePdfSection({ entries }: GroupedSimplePdfSectionProps) {
  if (entries.length === 0) return null

  // ── FUNCIÓN PARA OBTENER EL TEXTO DE VALOR DE REFERENCIA EN EL PDF ──
  const getRefText = (refValue: any): string => {
    if (!refValue) return "-"
    if (typeof refValue === "string") return refValue

    const ref = refValue as ReferenceValue

    if (ref.type === "two_point" || (ref.min !== undefined && ref.max !== undefined)) {
      return `${ref.min} - ${ref.max}`
    }
    if (ref.type === "single_point" || ref.max !== undefined) {
      return `Máx: ${ref.max}`
    }
    if (ref.type === "group" && Array.isArray(ref.groups)) {
      // Para grupos en la tabla del PDF, unimos las fases principales en un string corto
      return ref.groups.map(g => `${g.name}: ${g.min !== undefined ? `${g.min}-${g.max}` : g.max}`).join(" | ")
    }
    return "-"
  }

  return (
    <View wrap={false} style={{ marginTop: 10 }}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Pruebas de laboratorio:</Text>
      </View>

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderText, { flex: 2 }]}>Prueba</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Resultado</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Unidad</Text>
        <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Val. Ref.</Text> {/* Subido a 1.5 por si hay textos largos */}
        <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Método</Text>
      </View>

      {entries.map((entry, idx) => {
        const { data } = entry

        let isHigh = false
        let isLow = false

        // ── EVALUACIÓN MATEMÁTICA DE ALERTAS (FLAGS) ──
        if (data.refValue && data.result !== undefined && data.result !== "") {
          const val = Number(data.result)

          if (!isNaN(val) && typeof data.refValue !== "string") {
            const ref = data.refValue as ReferenceValue

            // Evaluación para rangos de dos puntos (Mínimo y Máximo)
            if (ref.min !== undefined && ref.max !== undefined) {
              if (val < ref.min) isLow = true
              if (val > ref.max) isHigh = true
            }
            // Evaluación para un solo punto máximo
            else if (ref.max !== undefined) {
              if (val > ref.max) isHigh = true
            }
          }
        }

        const refText = getRefText(data.refValue)

        return (
          <View key={entry.catalogId || idx} style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 2 }]}>{entry.testName}</Text>
            <Text style={[s.tableCellBold, { flex: 1 }, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
              {data.result} {isHigh ? "↑" : isLow ? "↓" : ""}
            </Text>
            <Text style={[s.tableCell, { flex: 1 }]}>{data.unit}</Text>
            <Text style={[s.tableCell, { flex: 1.5 }]}>{refText}</Text>
            <Text style={[s.tableCell, { flex: 1.5 }]}>{data.method}</Text>
          </View>
        )
      })}
    </View>
  )
}
