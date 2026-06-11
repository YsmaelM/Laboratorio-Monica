import { Page, View } from "@react-pdf/renderer"
import { ReportHeader } from "./ReportHeader"
import { PatientInfoBlock } from "./PatientInfoBlock"
import { ReportFooter } from "./ReportFooter"
import { s } from "../styles/pdfStyles"
import type { LabConfig, PatientSnapshot } from "@/shared/types"

interface PageWrapperProps {
  patient: PatientSnapshot
  labInfo: LabConfig
  orderDate: Date
  referringDoctor?: string
  children: React.ReactNode
}

export function PageWrapper({ patient, labInfo, orderDate, referringDoctor, children }: PageWrapperProps) {
  return (
    <Page size="LETTER" style={s.page}>
      {/* ── Fixed Header (repeats every page) ───────────── */}
      <View fixed style={s.headerFixed}>
        <ReportHeader labInfo={labInfo} />
        <PatientInfoBlock patient={patient} orderDate={orderDate} referringDoctor={referringDoctor} />
      </View>

      {/* ── Scrollable Body ─────────────────────────────── */}
      <View>
        {children}
      </View>

      {/* ── Fixed Footer (repeats every page) ───────────── */}
      <View fixed style={s.footerFixed}>
        <ReportFooter footerText={labInfo.footerText} signatureUrl={labInfo.signatureUrl} />
      </View>
    </Page>
  )
}
