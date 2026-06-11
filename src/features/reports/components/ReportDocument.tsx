import { Document } from "@react-pdf/renderer"
import { Timestamp } from "firebase/firestore"
import { PageWrapper } from "./PageWrapper"
import { PdfSectionFactory } from "./result-sections/PdfSectionFactory"
import { GroupedSimplePdfSection } from "./result-sections/GroupedSimplePdfSection"
import type { LabConfig, OrderResult, SimpleTestEntry } from "@/shared/types"

interface ReportDocumentProps {
  order: OrderResult
  labInfo: LabConfig
}

export function ReportDocument({ order, labInfo }: ReportDocumentProps) {
  // Safely convert Firestore Timestamp to Date (handles plain objects too)
  let orderDate: Date
  try {
    const raw = order.orderDate
    if (raw instanceof Timestamp) {
      orderDate = raw.toDate()
    } else if (typeof raw === "object" && raw !== null && "seconds" in raw) {
      orderDate = new Date((raw as any).seconds * 1000)
    } else {
      orderDate = new Date(raw as any)
    }
  } catch {
    orderDate = new Date()
  }

  const simpleTests = order.tests.filter(t => t.format === "simple") as SimpleTestEntry[]
  const otherTests = order.tests.filter(t => t.format !== "simple")

  return (
    <Document
      title={`Resultados - ${order.patientSnapshot.firstName} ${order.patientSnapshot.lastName}`}
      author={labInfo.labName}
      creator="Sistema de Laboratorio"
      language="es"
    >
      <PageWrapper
        patient={order.patientSnapshot}
        labInfo={labInfo}
        orderDate={orderDate}
        referringDoctor={order.referringDoctor}
      >
        <GroupedSimplePdfSection entries={simpleTests} />
        
        {otherTests.map((testEntry) => (
          <PdfSectionFactory key={testEntry.catalogId} entry={testEntry} />
        ))}
      </PageWrapper>
    </Document>
  )
}
