import { Document, Page, View, Text, Image } from "@react-pdf/renderer"
import { GroupedSimplePdfSection } from "@/features/reports/components/result-sections/GroupedSimplePdfSection"
import { PdfSectionFactory } from "@/features/reports/components/result-sections/PdfSectionFactory"
import type { LabConfig, BatchEntry, SimpleTestEntry } from "@/shared/types"
import { COLORS } from "@/features/reports/styles/pdfStyles"
import { StyleSheet } from "@react-pdf/renderer"

// Estilos compactos específicos para optimizar 2 reportes por hoja
const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 8.5,
    color: COLORS.text,
    paddingVertical: 18,
    paddingHorizontal: 36,
  },
  halfPage: {
    height: "48%", // Aproximadamente la mitad de la página Letter (con espacio para corte)
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  cutLineContainer: {
    height: "4%",
    justifyContent: "center",
    alignItems: "center",
  },
  cutLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    borderBottomStyle: "dashed",
    position: "relative",
  },
  cutScissors: {
    position: "absolute",
    top: -6,
    left: "50%",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    fontSize: 9,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
    marginBottom: 6,
  },
  labName: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.primary,
  },
  labInfo: {
    fontSize: 7,
    color: COLORS.textLight,
    textAlign: "right",
  },
  patientBlock: {
    flexDirection: "row",
    padding: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    marginBottom: 8,
  },
  patientCol: {
    flex: 1,
  },
  patientLabel: {
    fontSize: 6,
    color: COLORS.textLight,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  patientValue: {
    fontSize: 8.5,
    fontWeight: 600,
    color: COLORS.dark,
  },
  resultsContainer: {
    flex: 1,
    minHeight: 60,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signatureContainer: {
    alignItems: "center",
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 0.8,
    borderBottomColor: "#334155",
    marginTop: 2,
    marginBottom: 2,
  },
})

interface DualPageReportDocumentProps {
  entries: BatchEntry[]
  labInfo: LabConfig
  referringDoctor?: string
}

export function DualPageReportDocument({ entries, labInfo, referringDoctor }: DualPageReportDocumentProps) {
  // Agrupar en pares para renderizar 2 por página
  const pairs: Array<[BatchEntry, BatchEntry | null]> = []
  for (let i = 0; i < entries.length; i += 2) {
    pairs.push([entries[i], entries[i + 1] || null])
  }

  const dateStr = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const renderHalf = (entry: BatchEntry) => {
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

    return (
      <View style={s.halfPage}>
        {/* Header compacto */}
        <View style={s.header}>
          <View>
            {labInfo.logoUrl ? (
              <Image src={labInfo.logoUrl} style={{ width: 100, maxHeight: 40, marginBottom: 2 }} />
            ) : (
              <Text style={s.labName}>{labInfo.labName}</Text>
            )}
          </View>
          <View>
            <Text style={s.labInfo}>Tlf: {labInfo.phone}</Text>
            <Text style={s.labInfo}>{labInfo.rif ? `RIF: ${labInfo.rif}` : ""}</Text>
          </View>
        </View>

        {/* Datos Paciente compactos */}
        <View style={s.patientBlock}>
          <View style={s.patientCol}>
            <Text style={s.patientLabel}>Paciente</Text>
            <Text style={s.patientValue}>
              {entry.patient.firstName} {entry.patient.lastName}
            </Text>
          </View>
          <View style={s.patientCol}>
            <Text style={s.patientLabel}>Cédula / Edad / Sexo</Text>
            <Text style={s.patientValue}>
              {entry.patient.nationalId} | {entry.patient.age || "—"} años | {entry.patient.sex}
            </Text>
          </View>
          <View style={s.patientCol}>
            <Text style={s.patientLabel}>Fecha / Médico</Text>
            <Text style={s.patientValue}>
              {dateStr} | {referringDoctor || "N/A"}
            </Text>
          </View>
        </View>

        {/* Resultados */}
        <View style={s.resultsContainer}>
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
        </View>

        {/* Firma compacta */}
        <View style={s.footer}>
          <View>
            <Text style={{ fontSize: 6, color: COLORS.textLight }}>{labInfo.address}</Text>
          </View>
          <View style={s.signatureContainer}>
            {labInfo.signatureUrl && (
              <Image src={labInfo.signatureUrl} style={{ width: 100, height: 35, objectFit: "contain" }} />
            )}
            <View style={s.signatureLine} />
            <Text style={{ fontSize: 6.5, color: COLORS.textLight }}>Firma Autorizada</Text>
            <Text style={{ fontSize: 6.5, color: COLORS.textLight, fontWeight: 600 }}>{labInfo.bioanalista}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <Document
      title="Reporte Masivo Compacto (2 por hoja)"
      author={labInfo.labName}
      creator="Sistema de Laboratorio - Operativos"
      language="es"
    >
      {pairs.map(([entry1, entry2], idx) => (
        <Page key={`page-${idx}`} size="LETTER" style={s.page}>
          {/* Mitad superior */}
          {renderHalf(entry1)}

          {/* Línea divisoria */}
          <View style={s.cutLineContainer}>
            <View style={s.cutLine}>
              <Text style={s.cutScissors}>✂ Cortar aquí</Text>
            </View>
          </View>

          {/* Mitad inferior */}
          {entry2 ? renderHalf(entry2) : <View style={s.halfPage} />}
        </Page>
      ))}
    </Document>
  )
}
