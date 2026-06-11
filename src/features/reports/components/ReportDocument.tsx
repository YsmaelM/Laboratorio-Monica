import { Document } from "@react-pdf/renderer"
import { Timestamp } from "firebase/firestore"
import { PageWrapper } from "./PageWrapper"
import { PdfSectionFactory } from "./result-sections/PdfSectionFactory"
import type { LabConfig, OrderResult } from "@/shared/types"

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
        {order.tests.map((testEntry) => (
          <PdfSectionFactory key={testEntry.catalogId} entry={testEntry} />
        ))}
      </PageWrapper>
    </Document>
  )
}
