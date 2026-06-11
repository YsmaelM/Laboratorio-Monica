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
          <Image src={labInfo.logoUrl} style={{ width: 120, maxHeight: 60, marginBottom: 8 }} />
        ) : (
          <Text style={s.labName}>{labInfo.labName}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.labInfo}>{labInfo.address}</Text>
        <Text style={s.labInfo}>{labInfo.phone}</Text>
        {labInfo.licenseNumber ? (
          <Text style={s.labInfo}>RNC / Lic: {labInfo.licenseNumber}</Text>
        ) : null}
      </View>
    </View>
  )
}
