import { StyleSheet, Font } from "@react-pdf/renderer"

// Register a clean sans-serif font from local assets
const getFontUrl = (path: string) => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`
  }
  return path
}

Font.register({
  family: "Inter",
  fonts: [
    { src: getFontUrl("/fonts/Inter-Regular.ttf"), fontWeight: 400 },
    { src: getFontUrl("/fonts/Inter-SemiBold.ttf"), fontWeight: 600 },
    { src: getFontUrl("/fonts/Inter-Bold.ttf"), fontWeight: 700 },
  ],
})

const COLORS = {
  primary: "#2563eb",
  primaryLight: "#dbeafe",
  dark: "#1e293b",
  text: "#334155",
  textLight: "#64748b",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  white: "#ffffff",
  flagHigh: "#ef4444",
  flagLow: "#3b82f6",
  sensitive: "#22c55e",
  intermediate: "#eab308",
  resistant: "#ef4444",
}

export const s = StyleSheet.create({
  // ── Page ──────────────────────────────────────
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    color: COLORS.text,
    paddingTop: 165,
    paddingBottom: 120,
    paddingHorizontal: 40,
  },

  // ── Fixed Header ─────────────────────────────
  headerFixed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingTop: 25,
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labName: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.primary,
  },
  labInfo: {
    fontSize: 7.5,
    color: COLORS.textLight,
    textAlign: "right",
  },

  // ── Patient Info ─────────────────────────────
  patientBlock: {
    flexDirection: "row",
    marginBottom: 0,
    padding: 10,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
  },
  patientCol: {
    flex: 1,
  },
  patientLabel: {
    fontSize: 7,
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  patientValue: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.dark,
    marginBottom: 5,
  },

  // ── Section Headers ──────────────────────────
  sectionHeader: {
    marginTop: 0,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryLight,
  },
  subSectionTitle: {
    fontSize: 9.5,
    fontWeight: 600,
    color: COLORS.dark,
    marginTop: 4,
    marginBottom: 2,
  },

  // ── Tables ───────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 2,
  },
  tableHeaderText: {
    fontSize: 7.5,
    fontWeight: 600,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.borderLight,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.text,
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.dark,
  },

  // ── Flags ────────────────────────────────────
  flagHigh: {
    color: COLORS.flagHigh,
    fontWeight: 700,
  },
  flagLow: {
    color: COLORS.flagLow,
    fontWeight: 700,
  },

  // ── Key-Value pairs ──────────────────────────
  kvRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  kvLabel: {
    width: "40%",
    fontSize: 9,
    color: COLORS.textLight,
  },
  kvValue: {
    width: "60%",
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.dark,
  },

  // ── Antibiogram ──────────────────────────────
  abgSensitive: { color: COLORS.sensitive, fontWeight: 700 },
  abgIntermediate: { color: COLORS.intermediate, fontWeight: 700 },
  abgResistant: { color: COLORS.resistant, fontWeight: 700 },

  // ── Footer ───────────────────────────────────
  footerFixed: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.textLight,
  },
  pageNumber: {
    fontSize: 7,
    color: COLORS.textLight,
  },

  // ── Notes / textarea blocks ──────────────────
  borderLight: {
    color: COLORS.borderLight,
  },
  notesBlock: {
    marginTop: 6,
    padding: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    fontSize: 9,
    color: COLORS.text,
  },
})

export { COLORS }
