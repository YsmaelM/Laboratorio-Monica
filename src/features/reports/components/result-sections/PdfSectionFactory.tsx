import { View, Text } from "@react-pdf/renderer"
import type { TestEntry } from "@/shared/types"
import { SimplePdfSection } from "./SimplePdfSection"
import { HematologyPdfSection } from "./HematologyPdfSection"
import { UrinalysisPdfSection } from "./UrinalysisPdfSection"
import { StoolPdfSection } from "./StoolPdfSection"
import { CulturePdfSection } from "./CulturePdfSection"
import { s } from "../../styles/pdfStyles"

interface PdfSectionFactoryProps {
  entry: TestEntry
}

export function PdfSectionFactory({ entry }: PdfSectionFactoryProps) {
  return (
    <View style={{ marginBottom: 15 }} wrap={false}>
      <Text style={s.sectionTitle}>{entry.testName}</Text>
      {renderSection(entry)}
    </View>
  )
}

function renderSection(entry: TestEntry) {
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
    default:
      return <Text style={s.tableCell}>Formato desconocido</Text>
  }
}
