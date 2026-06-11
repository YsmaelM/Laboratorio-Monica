import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { StoolEntry } from "@/shared/types"

interface StoolPdfSectionProps {
  entry: StoolEntry
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

export function StoolPdfSection({ entry }: StoolPdfSectionProps) {
  const { data } = entry

  const renderSection = (title: string, dataObj: Record<string, string>, labels: Record<string, string>) => (
    <View style={{ flex: 1, paddingHorizontal: 4 }}>
      <Text style={s.subSectionTitle}>{title}</Text>
      <View style={{ borderTopWidth: 1, borderTopColor: s.borderLight.color }}>
        {Object.entries(dataObj)
          .filter(([key]) => key !== "parasites")
          .map(([key, value]) => (
            <View key={key} style={s.kvRow}>
              <Text style={s.kvLabel}>{labels[key] || key}</Text>
              <Text style={s.kvValue}>{value}</Text>
            </View>
          ))}
      </View>
    </View>
  )

  return (
    <View style={{ marginTop: 4 }} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        {renderSection("Macroscópico", data.macroscopic, MACRO_LABELS)}
        {renderSection("Microscópico", data.microscopic, MICRO_LABELS)}
        {renderSection("Químico", data.chemical, CHEM_LABELS)}
      </View>

      {/* Parasites as a full width block */}
      {!!data.microscopic.parasites ? (
        <View style={s.notesBlock}>
          <Text style={{ fontWeight: 600, marginBottom: 2 }}>Observación de Parásitos:</Text>
          <Text>{data.microscopic.parasites}</Text>
        </View>
      ) : null}
    </View>
  )
}
