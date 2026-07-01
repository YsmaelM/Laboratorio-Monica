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

  // 1. ORDENAMIENTO MATEMÁTICO REAL (Corregido para usar la prioridad de Firestore con un fallback alto)
  const sortedTests = [...order.tests].sort((a, b) => {
    // Si no tiene orden en la base de datos, le asignamos la prioridad más baja (99) por seguridad
    const orderA = (a as any).order !== undefined ? Number((a as any).order) : 99;
    const orderB = (b as any).order !== undefined ? Number((b as any).order) : 99;
    return orderA - orderB;
  });

  // 2. AGRUPAR ELEMENTOS SIMPLES CONSECUTIVOS CON EL MISMO ORDEN (Bug Corregido)
  const renderBlocks: Array<{ type: "grouped_simple"; entries: SimpleTestEntry[] } | { type: "other"; entry: TestEntry }> = [];

  sortedTests.forEach((test) => {
    const lastBlock = renderBlocks[renderBlocks.length - 1];

    if (test.format === "simple") {
      const orderCurrent = (test as any).order ?? 1;

      // CORRECCIÓN CRÍTICA: Leemos el orden del PRIMER elemento dentro del arreglo entries del bloque anterior
      if (lastBlock && lastBlock.type === "grouped_simple" && lastBlock.entries.length > 0) {
        const orderLast = (lastBlock.entries[0] as any).order ?? 1; // ← Acceso al índice [0] corregido
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

        {/* ── 3. RENDERIZADO DE BLOQUES CONTROLADOS ── */}
        {renderBlocks.map((block, idx) => {
          if (block.type === "grouped_simple") {
            return (
              <GroupedSimplePdfSection
                key={`simple-group-${idx}`}
                entries={block.entries}
              />
            )
          }

          return (
            <PdfSectionFactory
              key={block.entry.catalogId}
              entry={block.entry}
              patient={order.patientSnapshot}
            />
          )
        })}

      </PageWrapper>
    </Document>
  )
}
