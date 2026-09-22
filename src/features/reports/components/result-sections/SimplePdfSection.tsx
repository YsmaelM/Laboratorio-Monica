import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { SimpleTestEntry } from "@/shared/types"

interface SimplePdfSectionProps {
  entry: SimpleTestEntry
}

export function SimplePdfSection({ entry }: SimplePdfSectionProps) {
  const { data } = entry

  // Calculate flag if possible, assuming refRange format "min - max"
  let isHigh = false
  let isLow = false

  if (data.refValue && data.result !== undefined && data.result !== "") {
    const val = Number(data.result)

    if (!isNaN(val)) {
      if (typeof data.refValue === "string") {
        const parts = data.refValue.split("-").map((p: string) => Number(p.trim()))
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (val < parts[0]) isLow = true
          if (val > parts[1]) isHigh = true
        }
      } else {
        const ref = data.refValue as any
        if (ref.type === "group" && Array.isArray(ref.groups)) {
          const inAnyGroup = ref.groups.some((g: any) => {
            const gMin = g.min !== undefined ? Number(g.min) : -Infinity
            const gMax = g.max !== undefined ? Number(g.max) : Infinity
            return val >= gMin && val <= gMax
          })
          if (!inAnyGroup) {
            const allMins = ref.groups.map((g: any) => g.min).filter((v: any) => v !== undefined).map(Number)
            const allMaxs = ref.groups.map((g: any) => g.max).filter((v: any) => v !== undefined).map(Number)
            const globalMin = allMins.length > 0 ? Math.min(...allMins) : undefined
            const globalMax = allMaxs.length > 0 ? Math.max(...allMaxs) : undefined
            if (globalMin !== undefined && val < globalMin) isLow = true
            if (globalMax !== undefined && val > globalMax) isHigh = true
          }
        } else if (ref.min !== undefined && ref.max !== undefined) {
          if (val < Number(ref.min)) isLow = true
          if (val > Number(ref.max)) isHigh = true
        } else if (ref.max !== undefined) {
          if (val > Number(ref.max)) isHigh = true
        }
      }
    }
  }

  return (
    <View style={{ marginTop: 2 }}>
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderText, { flex: 2 }]}>Prueba</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Resultado</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Unidad</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Rango de Referencia</Text>
        <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Método</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { flex: 2 }]}>{entry.testName}</Text>
        <Text style={[s.tableCellBold, { flex: 1 }, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
          {`${data.result || "—"}${isHigh ? " ↑" : isLow ? " ↓" : ""}`}
        </Text>
        <Text style={[s.tableCell, { flex: 1 }]}>{data.unit}</Text>

        {/* ✅ CORRECTED VALUE CELL HOOK AGAINST MULTI-TYPE LAYOUT VALUES */}
        <Text style={[s.tableCell, { flex: 1 }]}>
          {typeof data.refValue === "string"
            ? data.refValue
            : data.refValue && typeof data.refValue === "object" && "type" in data.refValue && data.refValue.type === "group"
              ? "Por grupos (ver reporte)"
              : data.refValue && typeof data.refValue === "object" && "min" in data.refValue && data.refValue.min !== undefined
                ? `${data.refValue.min} - ${data.refValue.max}`
                : data.refValue && typeof data.refValue === "object" && "max" in data.refValue
                  ? `Máx: ${data.refValue.max}`
                  : "—"}
        </Text>

        <Text style={[s.tableCell, { flex: 1.5 }]}>{data.method}</Text>
      </View>
    </View>
  )
}
