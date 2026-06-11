import { View, Text, Image } from "@react-pdf/renderer"
import { s } from "../styles/pdfStyles"

interface ReportFooterProps {
  footerText?: string
  signatureUrl?: string
}

export function ReportFooter({ footerText, signatureUrl }: ReportFooterProps) {
  return (
    <View>
      <View style={{ flex: 1 }}>
        <Text style={s.footerText}>{footerText || "Resultados validados por el laboratorio."}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 30, marginTop: 12 }}>
        <View style={{ alignItems: "center", position: "relative", minHeight: 32 }}>
          {signatureUrl && (
            <Image 
              src={signatureUrl} 
              style={{ width: 80, height: 32, objectFit: "contain", marginBottom: -5 }} 
            />
          )}
          {!signatureUrl && <View style={{ height: 25 }} />}
          <View style={{ width: 100, borderBottomWidth: 1, borderBottomColor: "#334155", marginBottom: 4 }} />
          <Text style={{ fontSize: 7, color: "#64748b" }}>Firma Autorizada</Text>
        </View>
      </View>
      <View style={{ position: "absolute", bottom: 12, right: 40 }}>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>
    </View>
  )
}
