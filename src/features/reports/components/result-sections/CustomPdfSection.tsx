import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { CustomTestEntry } from "@/shared/types"

interface CustomPdfSectionProps {
  entry: CustomTestEntry
}

export function CustomPdfSection({ entry }: CustomPdfSectionProps) {
  const { customTemplate, data } = entry

  if (!customTemplate || customTemplate.rows.length === 0) {
    return (
      <Text style={s.tableCell}>Formato sin filas configuradas.</Text>
    )
  }

  let simpleRowCount = 0

  return (
    <View>
      {customTemplate.rows.map((row) => {
        // ── Empty row ──────────────────────────────────────────────
        if (row.type === "empty") {
          return <View key={row.id} style={{ height: 6 }} />
        }

        // ── Header row ─────────────────────────────────────────────
        if (row.type === "header") {
          return (
            <View key={row.id} style={{ marginTop: 6, marginBottom: 3 }}>
              <Text
                style={[s.subSectionTitle, { borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingBottom: 2 }]}
              >
                {row.text}
              </Text>
            </View>
          )
        }

        // ── Test row ───────────────────────────────────────────────
        if (row.type === "test" && row.columns.length > 0) {
          const totalWeight = row.columns.reduce((acc, c) => acc + (c.width ?? 1), 0)

          return (
            <View key={row.id}>
              {/* Column headers */}
              <View style={[s.tableHeader, { marginTop: 4 }]}>
                {row.columns.map((col) => {
                  const flex = (col.width ?? 1) / totalWeight
                  return (
                    <Text
                      key={col.id}
                      style={[s.tableHeaderText, { flex }]}
                    >
                      {col.label || "—"}
                    </Text>
                  )
                })}
              </View>

              {/* Data row */}
              <View style={s.tableRow}>
                {row.columns.map((col) => {
                  const flex = (col.width ?? 1) / totalWeight
                  const fieldKey = `${row.id}_${col.id}`
                  const value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? col.defaultValue ?? "")
                  return (
                    <Text
                      key={col.id}
                      style={[
                        s.tableCell,
                        { flex },
                        col.isHeaderOnly ? { fontFamily: "Helvetica-Bold" } : {}
                      ]}
                    >
                      {value || "—"}
                    </Text>
                  )
                })}
              </View>
            </View>
          )
        }

        // ── Simple row ─────────────────────────────────────────────
        if (row.type === "simple" && row.columns.length > 0) {
          const totalWeight = row.columns.reduce((acc, c) => acc + (c.width ?? 1), 0)
          const isOdd = simpleRowCount % 2 !== 0
          simpleRowCount++

          return (
            <View
              key={row.id}
              style={[
                s.tableRow,
                {
                  backgroundColor: isOdd ? "#f8fafc" : "#ffffff",
                  paddingVertical: 5.5,
                  paddingHorizontal: 6,
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#e2e8f0",
                }
              ]}
            >
              {row.columns.map((col) => {
                const flex = (col.width ?? 1) / totalWeight
                const fieldKey = `${row.id}_${col.id}`
                const value = col.isHeaderOnly ? col.label : (data[fieldKey] ?? col.defaultValue ?? "")
                return (
                  <Text
                    key={col.id}
                    style={[
                      s.tableCell,
                      { flex, fontSize: 8.5 },
                      col.isHeaderOnly ? { fontFamily: "Helvetica-Bold" } : {}
                    ]}
                  >
                    {value || "—"}
                  </Text>
                )
              })}
            </View>
          )
        }

        return null
      })}
    </View>
  )
}
