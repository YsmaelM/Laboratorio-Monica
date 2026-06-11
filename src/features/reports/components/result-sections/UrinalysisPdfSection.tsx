import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { UrinalysisEntry } from "@/shared/types"

interface UrinalysisPdfSectionProps {
  entry: UrinalysisEntry
}

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

export function UrinalysisPdfSection({ entry }: UrinalysisPdfSectionProps) {
  const { data } = entry

  const renderSection = (title: string, dataObj: Record<string, string>, labels: Record<string, string>) => (
    <View style={{ flex: 1, paddingHorizontal: 4 }}>
      <Text style={s.subSectionTitle}>{title}</Text>
      <View style={{ borderTopWidth: 1, borderTopColor: s.borderLight.color }}>
        {Object.entries(dataObj).map(([key, value]) => (
          <View key={key} style={s.kvRow}>
            <Text style={s.kvLabel}>{labels[key] || key}</Text>
            <Text style={s.kvValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  )

  return (
    <View style={{ marginTop: 4, flexDirection: "row", justifyContent: "space-between" }} wrap={false}>
      {renderSection("Físico", data.physical, PHYSICAL_LABELS)}
      {renderSection("Químico", data.chemical, CHEMICAL_LABELS)}
      {renderSection("Microscópico", data.microscopic, MICROSCOPIC_LABELS)}
    </View>
  )
}
