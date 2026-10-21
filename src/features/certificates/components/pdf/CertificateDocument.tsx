import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { LabConfig, CertificateData } from "@/shared/types"
import { ReportFooter } from "@/features/reports/components/ReportFooter"

const certStyles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    color: "#1e293b",
    paddingTop: 36,
    paddingBottom: 90,
    paddingHorizontal: 40,
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1.2,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  labLogo: {
    width: 170,
    maxHeight: 80,
    objectFit: "contain",
    marginBottom: 4,
  },
  labNameText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 2,
  },
  headerInfoText: {
    fontSize: 8.5,
    color: "#334155",
    lineHeight: 1.4,
    textAlign: "right",
  },
  headerDateText: {
    fontSize: 9,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 3,
    textAlign: "right",
  },

  // Gray section bar
  bannerBar: {
    backgroundColor: "#d1d5db",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: "#1f2937",
  },
  bannerCenteredBar: {
    backgroundColor: "#d1d5db",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    marginVertical: 14,
    alignItems: "center",
  },
  bannerCenteredTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1f2937",
    textAlign: "center",
  },

  // Patient info grid
  infoGrid: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 3,
  },
  infoLabel: {
    width: 110,
    fontSize: 9.5,
    color: "#1f2937",
  },
  infoValue: {
    flex: 1,
    fontSize: 9.5,
    color: "#0f172a",
  },
  infoValueBold: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: 700,
    color: "#0f172a",
  },

  // Spacer bar
  separatorBar: {
    backgroundColor: "#e5e7eb",
    height: 12,
    marginVertical: 4,
  },

  // Body content
  bodyContainer: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  bodyParagraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#0f172a",
    textAlign: "justify",
  },

  // Footer wrapper
  footerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
})

interface CertificateDocumentProps {
  data: CertificateData
  labInfo: LabConfig
}

export function CertificateDocument({ data, labInfo }: CertificateDocumentProps) {
  // Format date display
  const formatDateDisplay = (dateString: string) => {
    try {
      if (!dateString) return ""
      const [year, month, day] = dateString.split("-")
      if (year && month && day) {
        return `${day}/${month}/${year}`
      }
      const d = new Date(dateString)
      const dd = String(d.getDate()).padStart(2, "0")
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    } catch {
      return dateString
    }
  }

  const formattedDate = formatDateDisplay(data.date)

  const patientFullName = `${data.firstName || ""} ${data.lastName || ""}`.trim()

  return (
    <Document
      title={`Constancia - ${patientFullName || "Paciente"}`}
      author={labInfo.labName || "Laboratorio Clínico"}
      creator="LabSys"
      language="es"
    >
      <Page size="LETTER" style={certStyles.page}>
        {/* ── 1. Header con Logo y Datos del Lab ── */}
        <View style={certStyles.headerRow}>
          <View style={certStyles.headerLeft}>
            {labInfo.logoUrl ? (
              <Image src={labInfo.logoUrl} style={certStyles.labLogo} />
            ) : (
              <Text style={certStyles.labNameText}>{labInfo.labName || "Laboratorio Clínico"}</Text>
            )}
          </View>
          <View style={certStyles.headerRight}>
            <Text style={certStyles.headerDateText}>Fecha: {formattedDate}</Text>
            {labInfo.bioanalista && (
              <Text style={certStyles.headerInfoText}>{labInfo.bioanalista}</Text>
            )}
            {labInfo.phone && (
              <Text style={certStyles.headerInfoText}>Tlf: {labInfo.phone}</Text>
            )}
            {labInfo.rif && (
              <Text style={certStyles.headerInfoText}>RIF: {labInfo.rif}</Text>
            )}
            {labInfo.emailAdress && (
              <Text style={certStyles.headerInfoText}>Correo: {labInfo.emailAdress}</Text>
            )}
          </View>
        </View>

        {/* ── 2. Información del Paciente ── */}
        <View style={certStyles.bannerBar}>
          <Text style={certStyles.bannerTitle}>Informacion del paciente</Text>
        </View>

        <View style={certStyles.infoGrid}>
          <View style={certStyles.infoRow}>
            <Text style={certStyles.infoLabel}>Nombre:</Text>
            <Text style={certStyles.infoValueBold}>{patientFullName || "-"}</Text>
          </View>

          <View style={certStyles.infoRow}>
            <Text style={certStyles.infoLabel}>Cedula:</Text>
            <Text style={certStyles.infoValue}>
              {data.nationalId ? data.nationalId : data.isMinor ? "Menor de edad (Sin cédula)" : "-"}
            </Text>
          </View>

          <View style={certStyles.infoRow}>
            <Text style={certStyles.infoLabel}>Edad</Text>
            <Text style={certStyles.infoValue}>
              {data.age ? `${data.age} años` : "-"}
            </Text>
          </View>

          {data.isMinor && data.representativeName && (
            <View style={certStyles.infoRow}>
              <Text style={certStyles.infoLabel}>Representante:</Text>
              <Text style={certStyles.infoValue}>{data.representativeName}</Text>
            </View>
          )}

          {data.isMinor && data.representativeNationalId && (
            <View style={certStyles.infoRow}>
              <Text style={certStyles.infoLabel}>Cédula Rep.:</Text>
              <Text style={certStyles.infoValue}>{data.representativeNationalId}</Text>
            </View>
          )}
        </View>

        {/* ── 3. Separador ── */}
        <View style={certStyles.separatorBar} />

        {/* ── 4. Título Centrado: Constancia ── */}
        <View style={certStyles.bannerCenteredBar}>
          <Text style={certStyles.bannerCenteredTitle}>Constancia</Text>
        </View>

        {/* ── 5. Párrafo del Cuerpo ── */}
        <View style={certStyles.bodyContainer}>
          <Text style={certStyles.bodyParagraph}>{data.bodyText || ""}</Text>
        </View>

        {/* ── 6. Pie de Página con Firma ── */}
        <View fixed style={certStyles.footerWrapper}>
          <ReportFooter
            labInfo={labInfo}
            signatureUrl={data.includeSignature ? labInfo.signatureUrl : undefined}
          />
        </View>
      </Page>
    </Document>
  )
}
