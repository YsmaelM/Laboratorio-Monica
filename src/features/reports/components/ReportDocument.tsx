import { Document } from "@react-pdf/renderer"
import { Timestamp } from "firebase/firestore"
import { PageWrapper } from "./PageWrapper"
import { PdfSectionFactory } from "./result-sections/PdfSectionFactory"
import { GroupedSimplePdfSection } from "./result-sections/GroupedSimplePdfSection"
import type { LabConfig, OrderResult, SimpleTestEntry, TestEntry } from "@/shared/types"

interface ReportDocumentProps {
  order: OrderResult
  labInfo: LabConfig
}

export function ReportDocument({ order, labInfo }: ReportDocumentProps) {
  // Safely convert Firestore Timestamp to Date (handles plain objects too)
  let orderDate: Date
  console.log("🕵️‍♂️ [VOLCADO COMPLETO ORDEN EN PDF]:", JSON.stringify(order, null, 2));
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

  // 1. ORDENAMIENTO MATEMÁTICO REAL
  const sortedTests = [...order.tests].sort((a, b) => {
    const orderA = (a as any).order !== undefined ? Number((a as any).order) : 99;
    const orderB = (b as any).order !== undefined ? Number((b as any).order) : 99;
    return orderA - orderB;
  });

  // 2. AGRUPAR ELEMENTOS SIMPLES CONSECUTIVOS CON EL MISMO ORDEN
  const renderBlocks: Array<{ type: "grouped_simple"; entries: SimpleTestEntry[] } | { type: "other"; entry: TestEntry }> = [];

  sortedTests.forEach((test) => {
    const lastBlock = renderBlocks[renderBlocks.length - 1];

    if (test.format === "simple") {
      const orderCurrent = (test as any).order ?? 1;

      if (lastBlock && lastBlock.type === "grouped_simple" && lastBlock.entries.length > 0) {
        const orderLast = (lastBlock.entries[0] as any).order ?? 1;
        if (orderLast === orderCurrent) {
          lastBlock.entries.push(test as SimpleTestEntry);
          return;
        }
      }

      renderBlocks.push({ type: "grouped_simple", entries: [test as SimpleTestEntry] });
    } else {
      renderBlocks.push({ type: "other", entry: test });
    }
  });

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
        {/* ── 3. RENDERIZADO DE BLOQUES COMPACTADO SIN ESPACIOS SUELTOS ── */}
        {renderBlocks.map((block, idx) => {
          if (block.type === "grouped_simple") {
            return (
              <GroupedSimplePdfSection
                key={`simple-group-${idx}`}
                entries={block.entries}
                patient={order.patientSnapshot}
              />
            );
          }
          return (
            <PdfSectionFactory
              key={block.entry.catalogId}
              entry={block.entry}
              patient={order.patientSnapshot}
            />
          );
        })}
      </PageWrapper>
    </Document>
  )
}
