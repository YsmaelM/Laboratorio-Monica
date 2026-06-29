import { View, Text } from "@react-pdf/renderer"

import type { TestEntry, PatientSnapshot } from "@/shared/types"
import { SimplePdfSection } from "./SimplePdfSection"
import { HematologyPdfSection } from "./HematologyPdfSection"
import { UrinalysisPdfSection } from "./UrinalysisPdfSection"
import { StoolPdfSection } from "./StoolPdfSection"
import { CulturePdfSection } from "./CulturePdfSection"
import { CustomPdfSection } from "./CustomPdfSection"
import { s } from "../../styles/pdfStyles"

interface PdfSectionFactoryProps {
  entry: TestEntry
  patient?: PatientSnapshot
}

export function PdfSectionFactory({ entry, patient }: PdfSectionFactoryProps) {
  return (
    <View style={{ marginBottom: 15 }} wrap={false}>
      <Text style={s.sectionTitle}>{entry.testName}</Text>
      {renderSection(entry, patient)}
    </View>
  )
}

function renderSection(entry: TestEntry, patient?: PatientSnapshot) {
  switch (entry.format) {
    case "simple":
      return <SimplePdfSection entry={entry} />
    case "hematology":
      return <HematologyPdfSection entry={entry} />
    case "urinalysis":
      return <UrinalysisPdfSection entry={entry} />
    case "stool":
      return <StoolPdfSection entry={entry} />
    case "culture":
      return <CulturePdfSection entry={entry} />
    case "custom":
      return <CustomPdfSection entry={entry} patient={patient} />
    default:
      return <Text style={s.tableCell}>Formato desconocido</Text>
  }
}
