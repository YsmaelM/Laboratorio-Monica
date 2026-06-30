import { View, Text, Image } from "@react-pdf/renderer"
import { s } from "../styles/pdfStyles"
import type { LabConfig } from "@/shared/types"

interface ReportFooterProps {
  signatureUrl?: string
  labInfo: LabConfig
}

export function ReportFooter({ labInfo, signatureUrl }: ReportFooterProps) {
  return (
    // 1. El contenedor padre ahora usa el estilo fixed que ocupa todo el ancho
    <View style={s.footerFixed}>

      {/* 2. Un bloque invisible a la izquierda para equilibrar el Flexbox y que la firma quede centrada */}
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <Text style={{ fontSize: 7, color: "#64748b" }}>{labInfo.address}</Text>
        <Text style={{ fontSize: 7, color: "#64748b" }}>LabSys</Text>
      </View>

      {/* 3. Bloque de la firma en el centro exacto */}
      <View style={{ alignItems: "center", flex: 2 }}>
        {signatureUrl && (
          <Image
            src={signatureUrl}
            style={{ width: 150, height: 62, objectFit: "contain", marginBottom: -5 }}
          />
        )}
        {!signatureUrl && <View style={{ height: 25 }} />}
        <View style={{ width: 100, borderBottomWidth: 1, borderBottomColor: "#334155", marginBottom: 4 }} />
        <Text style={{ fontSize: 7, color: "#64748b" }}>Firma Autorizada</Text>
        <Text style={{ fontSize: 7, color: "#64748b" }}>{labInfo.phone}</Text>
        <Text style={{ fontSize: 7, color: "#64748b" }}>{labInfo.bioanalista}</Text>
      </View>

      {/* 4. Bloque del número de página alineado a la derecha */}
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>

    </View>
  )
}
