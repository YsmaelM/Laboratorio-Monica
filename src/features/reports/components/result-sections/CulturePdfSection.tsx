import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { CultureEntry } from "@/shared/types"

interface CulturePdfSectionProps {
  entry: CultureEntry
}

export function CulturePdfSection({ entry }: CulturePdfSectionProps) {
  const { data } = entry

  const isPositive = data.cultureResult === "Positive" || data.cultureResult === "Positivo"

  const textToPrint = data.cultureResultNotes === "custom_response"
    ? data.customNegativeText
    : data.cultureResultNotes;

  const hasGram = !!data.gramStain;

  // Filtrar las celdas para ignorar filas vacías que se hayan quedado guardadas sin antibiótico seleccionado
  const validAntibiogram = (data.antibiogram || []).filter(row => row.antibiotic && row.antibiotic.trim() !== "");

  return (
    <View style={{ marginTop: 4 }}>
      {/* Basic Info */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.subSectionTitle}>Tipo de Muestra</Text>
          <Text style={s.tableCell}>{data.sampleType || "No especificada"}</Text>
        </View>

        {hasGram && (
          <View style={{ flex: 1.5 }}>
            <Text style={s.subSectionTitle}>Tinción de Gram</Text>
            <Text style={s.tableCell}>{data.gramStain}</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={s.subSectionTitle}>Resultado de Cultivo</Text>
          <Text style={[s.tableCellBold, isPositive ? s.flagHigh : { color: "#10b981" }]}>
            {data.cultureResult}
          </Text>
        </View>
      </View>

      {/* Caso A: Positive details & Antibiogram */}
      {isPositive ? (
        <View>
          {/* DISEÑO MEJORADO: Microorganismo y Conteo de colonias más juntos */}
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <View style={{ flex: 1.2 }}> {/* Reducido de 2 a 1.2 para acercar las columnas */}
              <Text style={s.subSectionTitle}>Microorganismo Aislado</Text>
              <Text style={s.tableCellBold}>{data.organism || "—"}</Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={s.subSectionTitle}>Conteo de Colonias</Text>
              <Text style={s.tableCell}>{data.colonyCount || "N/A"}</Text>
            </View>
          </View>

          {validAntibiogram.length > 0 ? (
            <View wrap={false}>
              <Text style={s.subSectionTitle}>Antibiograma</Text>

              {/* CABECERA CORREGIDA: Sin columna de MIC */}
              <View style={[s.tableHeader, { marginTop: 4 }]}>
                <Text style={[s.tableHeaderText, { flex: 2.5 }]}>Antibiótico</Text>
                <Text style={[s.tableHeaderText, { flex: 1, textAlign: "center" }]}>Resultado</Text>
              </View>

              {/* FILAS FILTRADAS SANEADAS */}
              {validAntibiogram.map((row, idx) => {
                let resultStyle = {}
                let resultLabel: string = row.result
                if (row.result === "S") { resultStyle = s.abgSensitive; resultLabel = "Sensible" }
                if (row.result === "I") { resultStyle = s.abgIntermediate; resultLabel = "Intermedio" }
                if (row.result === "R") { resultStyle = s.abgResistant; resultLabel = "Resistente" }

                return (
                  <View key={idx} style={[s.tableRow, idx % 2 !== 0 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableCell, { flex: 2.5 }]}>{row.antibiotic}</Text>
                    <Text style={[s.tableCell, { flex: 1, textAlign: "center" }, resultStyle]}>
                      {resultLabel}
                    </Text>
                  </View>
                )
              })}
            </View>
          ) : null}
        </View>
      ) : (
        /* Caso B: Detalles de Cultivo Negativo */
        <View wrap={false} style={{ marginTop: 4, padding: 6, backgroundColor: "#1e293b", borderRadius: 8 }}>
          <Text style={s.subSectionTitle}>Observaciones del Cultivo:</Text>
          <Text style={[s.tableCell, { marginTop: 2, lineHeight: 1.3 }]}>
            {textToPrint || "No se observó desarrollo bacteriano."}
          </Text>
        </View>
      )}

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
