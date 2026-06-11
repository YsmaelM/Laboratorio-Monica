import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { HematologyEntry } from "@/shared/types"

interface HematologyPdfSectionProps {
  entry: HematologyEntry
}

export function HematologyPdfSection({ entry }: HematologyPdfSectionProps) {
  const { data } = entry

  return (
    <View style={{ marginTop: 4 }}>
      {data.sections.map((section, idx) => (
        <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
          <Text style={s.subSectionTitle}>{section.sectionName}</Text>
          
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 2 }]}>Parámetro</Text>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>Resultado</Text>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>Unidad</Text>
            <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Rango de Referencia</Text>
          </View>

          {section.results.map((row, rIdx) => {
            let isHigh = false
            let isLow = false
            
            if (row.refRange && typeof row.value === 'string' && !isNaN(Number(row.value))) {
              const val = Number(row.value)
              const parts = row.refRange.split('-').map(p => Number(p.trim()))
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                if (val < parts[0]) isLow = true
                if (val > parts[1]) isHigh = true
              }
            }

            return (
              <View key={rIdx} style={[s.tableRow, rIdx % 2 !== 0 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableCell, { flex: 2 }]}>{row.label}</Text>
                <Text style={[s.tableCellBold, { flex: 1 }, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
                  {row.value} {isHigh ? "↑" : isLow ? "↓" : ""}
                </Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{row.unit}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{row.refRange}</Text>
              </View>
            )
          })}
        </View>
      ))}

      {!!data.smearNotes && (
        <View wrap={false} style={s.notesBlock}>
          <Text style={{ fontWeight: 600, marginBottom: 2 }}>Notas de Frotis Periférico:</Text>
          <Text>{data.smearNotes}</Text>
        </View>
      )}
    </View>
  )
}
