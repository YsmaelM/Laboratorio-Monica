import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { SimpleTestEntry } from "@/shared/types"

interface GroupedSimplePdfSectionProps {
  entries: SimpleTestEntry[]
}

export function GroupedSimplePdfSection({ entries }: GroupedSimplePdfSectionProps) {
  if (entries.length === 0) return null

  return (
    <View wrap={false} style={{ marginTop: 10 }}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Pruebas de laboratorio:</Text>
      </View>

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderText, { flex: 2 }]}>Prueba</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Resultado</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Unidad</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Val. Ref.</Text>
        <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Método</Text>
      </View>

      {entries.map((entry, idx) => {
        const { data } = entry

        // Calculate flag if possible, assuming refRange format "min - max"
        let isHigh = false
        let isLow = false

        if (data.refRange && typeof data.result === 'string' && !isNaN(Number(data.result))) {
          const val = Number(data.result)
          const parts = data.refRange.split('-').map(p => Number(p.trim()))
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            if (val < parts[0]) isLow = true
            if (val > parts[1]) isHigh = true
          }
        }

        return (
          <View key={entry.catalogId || idx} style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 2 }]}>{entry.testName}</Text>
            <Text style={[s.tableCellBold, { flex: 1 }, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
              {data.result} {isHigh ? "↑" : isLow ? "↓" : ""}
            </Text>
            <Text style={[s.tableCell, { flex: 1 }]}>{data.unit}</Text>
            <Text style={[s.tableCell, { flex: 1 }]}>{data.refRange}</Text>
            <Text style={[s.tableCell, { flex: 1.5 }]}>{data.method}</Text>
          </View>
        )
      })}
    </View>
  )
}
