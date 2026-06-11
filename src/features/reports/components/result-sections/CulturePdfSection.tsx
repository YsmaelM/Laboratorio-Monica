import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { CultureEntry } from "@/shared/types"

interface CulturePdfSectionProps {
  entry: CultureEntry
}

export function CulturePdfSection({ entry }: CulturePdfSectionProps) {
  const { data } = entry
  
  const isPositive = data.cultureResult === "Positive" || data.cultureResult === "Positivo"

  return (
    <View style={{ marginTop: 4 }}>
      {/* Basic Info */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.subSectionTitle}>Tipo de Muestra</Text>
          <Text style={s.tableCell}>{data.sampleType || "No especificada"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.subSectionTitle}>Tinción de Gram</Text>
          <Text style={s.tableCell}>{data.gramStain || "No realizada"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.subSectionTitle}>Resultado de Cultivo</Text>
          <Text style={[s.tableCellBold, isPositive ? s.flagHigh : {}]}>
            {data.cultureResult}
          </Text>
        </View>
      </View>

      {/* Positive details & Antibiogram */}
      {isPositive ? (
        <View>
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <View style={{ flex: 2 }}>
              <Text style={s.subSectionTitle}>Microorganismo Aislado</Text>
              <Text style={s.tableCellBold}>{data.organism}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.subSectionTitle}>Conteo de Colonias</Text>
              <Text style={s.tableCell}>{data.colonyCount || "N/A"}</Text>
            </View>
          </View>

          {data.antibiogram && data.antibiogram.length > 0 ? (
            <View wrap={false}>
              <Text style={s.subSectionTitle}>Antibiograma</Text>
              <View style={[s.tableHeader, { marginTop: 4 }]}>
                <Text style={[s.tableHeaderText, { flex: 2 }]}>Antibiótico</Text>
                <Text style={[s.tableHeaderText, { flex: 1, textAlign: "center" }]}>Resultado</Text>
                <Text style={[s.tableHeaderText, { flex: 1, textAlign: "center" }]}>MIC (Opcional)</Text>
              </View>
              {data.antibiogram.map((row, idx) => {
                let resultStyle = {}
                let resultLabel: string = row.result
                if (row.result === "S") { resultStyle = s.abgSensitive; resultLabel = "Sensible" }
                if (row.result === "I") { resultStyle = s.abgIntermediate; resultLabel = "Intermedio" }
                if (row.result === "R") { resultStyle = s.abgResistant; resultLabel = "Resistente" }

                return (
                  <View key={idx} style={[s.tableRow, idx % 2 !== 0 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableCell, { flex: 2 }]}>{row.antibiotic}</Text>
                    <Text style={[s.tableCell, { flex: 1, textAlign: "center" }, resultStyle]}>
                      {resultLabel}
                    </Text>
                    <Text style={[s.tableCell, { flex: 1, textAlign: "center" }]}>{row.mic || "-"}</Text>
                  </View>
                )
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Notes */}
      {!!data.notes ? (
        <View wrap={false} style={s.notesBlock}>
          <Text style={{ fontWeight: 600, marginBottom: 2 }}>Notas Adicionales:</Text>
          <Text>{data.notes}</Text>
        </View>
      ) : null}
    </View>
  )
}
