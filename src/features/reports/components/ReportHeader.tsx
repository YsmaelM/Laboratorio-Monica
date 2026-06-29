import { View, Text, Image } from "@react-pdf/renderer"
import { s } from "../styles/pdfStyles"
import type { LabConfig } from "@/shared/types"

interface ReportHeaderProps {
  labInfo: LabConfig
}

export function ReportHeader({ labInfo }: ReportHeaderProps) {
  return (
    <View style={s.headerRow}>
      <View style={{ flex: 1 }}>
        {labInfo.logoUrl ? (
          <Image src={labInfo.logoUrl} style={{ width: 160, maxHeight: 100, marginBottom: 8 }} />
        ) : (
          <Text style={s.labName}>{labInfo.labName}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.labInfo}> Tlf:{labInfo.phone}</Text>
        {labInfo.emailAdress ? (
          <Text style={s.labInfo}>
            Correo: {labInfo.emailAdress}
          </Text>
        ) : null}
        {labInfo.rif ? (
          <Text style={s.labInfo}>
            RIF: {labInfo.rif}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
