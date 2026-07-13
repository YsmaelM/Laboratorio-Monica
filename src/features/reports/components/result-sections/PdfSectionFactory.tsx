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
  switch (entry.format) {
    case "simple":
      // wrap={false} en el contenedor raíz: título + tabla siempre juntos
      return (
        <View wrap={false} style={{ marginBottom: 4 }}>
          <Text style={[s.sectionTitle, { marginBottom: 4 }]}>{entry.testName}</Text>
          <SimplePdfSection entry={entry} />
        </View>
      )
    case "culture":
      return (
        <View wrap={false} style={{ marginBottom: 6 }}>
          <Text style={[s.sectionTitle, { marginBottom: 4 }]}>{entry.testName}</Text>
          <CulturePdfSection entry={entry} />
        </View>
      )
    case "custom":
      // El título se pasa a CustomPdfSection para que quede dentro del mismo
      // contenedor wrap={false} junto con sus filas de datos.
      return <CustomPdfSection entry={entry} patient={patient} showTitle />
    default:
      return <Text style={s.tableCell}>Formato desconocido</Text>
  }
}
