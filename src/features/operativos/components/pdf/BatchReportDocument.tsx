import { Document, View, Text } from "@react-pdf/renderer"
import { PageWrapper } from "@/features/reports/components/PageWrapper"
import { PdfSectionFactory } from "@/features/reports/components/result-sections/PdfSectionFactory"
import { GroupedSimplePdfSection } from "@/features/reports/components/result-sections/GroupedSimplePdfSection"
import type { LabConfig, BatchEntry, SimpleTestEntry } from "@/shared/types"
import { s } from "@/features/reports/styles/pdfStyles"

interface BatchReportDocumentProps {
  entries: BatchEntry[]
  labInfo: LabConfig
  referringDoctor?: string
}

export function BatchReportDocument({ entries, labInfo, referringDoctor }: BatchReportDocumentProps) {
  return (
    <Document
      title="Reporte Masivo de Resultados"
      author={labInfo.labName}
      creator="Sistema de Laboratorio - Operativos"
      language="es"
    >
      {entries.map((entry) => {
        // Ordenar pruebas de cada paciente
        const sortedTests = [...entry.tests].sort((a, b) => {
          const orderA = (a as any).order !== undefined ? Number((a as any).order) : 99
          const orderB = (b as any).order !== undefined ? Number((b as any).order) : 99
          return orderA - orderB
        })

        // Agrupar elementos simples consecutivos
        const renderBlocks: Array<
          | { type: "grouped_simple"; entries: SimpleTestEntry[] }
          | { type: "other"; entry: any }
        > = []

        sortedTests.forEach((test) => {
          const lastBlock = renderBlocks[renderBlocks.length - 1]

          if (test.format === "simple") {
            const orderCurrent = (test as any).order ?? 1

            if (lastBlock && lastBlock.type === "grouped_simple" && lastBlock.entries.length > 0) {
              const orderLast = (lastBlock.entries[0] as any).order ?? 1
              if (orderLast === orderCurrent) {
                lastBlock.entries.push(test as SimpleTestEntry)
                return
              }
            }

            renderBlocks.push({ type: "grouped_simple", entries: [test as SimpleTestEntry] })
          } else {
            renderBlocks.push({ type: "other", entry: test })
          }
        })

        const orderDate = new Date()

        return (
          <PageWrapper
            key={entry.patientId}
            patient={entry.patient}
            labInfo={labInfo}
            orderDate={orderDate}
            referringDoctor={referringDoctor}
          >
            {renderBlocks.map((block, idx) => {
              if (block.type === "grouped_simple") {
                return (
                  <GroupedSimplePdfSection
                    key={`simple-group-${idx}`}
                    entries={block.entries}
                    patient={entry.patient}
                  />
                )
              }
              return (
                <PdfSectionFactory
                  key={block.entry.catalogId}
                  entry={block.entry}
                  patient={entry.patient}
                />
              )
            })}
          </PageWrapper>
        )
      })}
    </Document>
  )
}
