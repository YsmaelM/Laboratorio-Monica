import { View, Text } from "@react-pdf/renderer"
import type { TestEntry, PatientSnapshot } from "@/shared/types"
import { SimplePdfSection } from "./SimplePdfSection"
import { CulturePdfSection } from "./CulturePdfSection"
import { CustomPdfSection } from "./CustomPdfSection"
import { s } from "../../styles/pdfStyles"

interface PdfSectionFactoryProps {
  entry: TestEntry
  patient?: PatientSnapshot
}

export function PdfSectionFactory({ entry, patient }: PdfSectionFactoryProps) {
  // Retornamos directamente un contenedor limpio para evitar colisiones en cascada de layouts en el PDF
  return (
    <View style={{ marginBottom: 15 }} wrap={false}>
      {renderSection(entry, patient)}
    </View>
  )
}

function renderSection(entry: TestEntry, patient?: PatientSnapshot) {
  switch (entry.format) {
    case "simple":
      return (
        <View>
          <Text style={[s.sectionTitle, { marginBottom: 4 }]}>{entry.testName}</Text>
          <SimplePdfSection entry={entry} />
        </View>
      )
    case "culture":
      return (
        <View>
          <Text style={[s.sectionTitle, { marginBottom: 4 }]}>{entry.testName}</Text>
          <CulturePdfSection entry={entry} />
        </View>
      )
    case "custom":
      return (
        <View>
          {/* El título principal se maneja como View aislado para que no bloquee las tablas dinámicas */}
          <View style={{ marginBottom: 4 }}>
            <Text style={s.sectionTitle}>{entry.testName}</Text>
          </View>
          <CustomPdfSection entry={entry} patient={patient} />
        </View>
      )
    default:
      return <Text style={s.tableCell}>Formato desconocido</Text>
  }
}
