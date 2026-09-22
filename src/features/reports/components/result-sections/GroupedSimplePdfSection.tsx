import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { SimpleTestEntry, ReferenceValue, PatientSnapshot } from "@/shared/types"

interface GroupedSimplePdfSectionProps {
  entries: SimpleTestEntry[]
  patient?: PatientSnapshot
}

export function GroupedSimplePdfSection({ entries, patient }: GroupedSimplePdfSectionProps) {
  if (entries.length === 0) return null

  // ── 1. SIEMPRE RETORNA EL DESGLOSE COMPLETO EN LISTA VERTICAL ──
  const getRefText = (refValue: any) => {
    if (!refValue) return "-"
    if (typeof refValue === "string") return refValue

    const ref = refValue as ReferenceValue

    if (ref.type === "group" && Array.isArray(ref.groups)) {
      return ref.groups.map(g => `${g.name}: ${g.type === "two_point" ? `${g.min ?? 0}-${g.max ?? 0}` : g.type === "desde" ? `Mín: ${g.min ?? 0}` : g.max ?? 0}`);
    }

    if (ref.type === "desde" || (ref.min !== undefined && ref.max === undefined)) {
      return `Mín: ${ref.min}`
    }

    if (ref.type === "two_point" || (ref.min !== undefined && ref.max !== undefined)) {
      return `${ref.min} - ${ref.max}`
    }
    if (ref.type === "single_point" || ref.max !== undefined) {
      return `Máx: ${ref.max}`
    }
    return "-"
  }

  let simpleRowCount = 0

  return (
    <View style={{ marginTop: 10 }}>
      {/* Título + encabezado de tabla: juntos para evitar título huérfano */}
      <View style={s.sectionHeader} wrap={false}>
        <Text style={s.sectionTitle}>Pruebas de laboratorio:</Text>
      </View>

      {/* fixed: se repite en cada página cuando la tabla se extiende */}
      <View fixed style={s.tableHeader}>
        <Text style={[s.tableHeaderText, { flex: 2 }]}>Prueba</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Resultado</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Unidad</Text>
        <Text style={[s.tableHeaderText, { flex: 2 }]}>Val. Ref.</Text>
        <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Método</Text>
      </View>

      {/* Renderizado continuo que fluye y salta de página automáticamente */}
      {entries.map((entry, idx) => {
        const { data } = entry

        let isHigh = false
        let isLow = false

        let targetMin: number | undefined = undefined
        let targetMax: number | undefined = undefined

        if (data.refValue && typeof data.refValue !== "string") {
          const ref = data.refValue as ReferenceValue

          if (ref.type === "group" && Array.isArray(ref.groups)) {
            const pAge = patient?.age ?? 0;
            const pSex = (patient?.sex || "").toUpperCase();

            const matchedGroups = ref.groups.filter((g: any) => {
              if (!patient) return true;
              const minA = g.minAge !== undefined ? g.minAge : 0;
              const maxA = g.maxAge !== undefined ? g.maxAge : 120;
              const ageMatches = pAge >= minA && pAge < maxA;

              const nameLower = (g.name || "").toLowerCase();
              let sexMatches = true;
              if (nameLower.includes("hombre") || nameLower.includes("masculino") || nameLower.includes("varon")) {
                sexMatches = pSex === "M" || pSex === "MASCULINO";
              } else if (nameLower.includes("mujer") || nameLower.includes("femenino") || nameLower.includes("dama")) {
                sexMatches = pSex === "F" || pSex === "FEMENINO";
              }
              return ageMatches && sexMatches;
            });

            if (matchedGroups.length === 1) {
              targetMin = matchedGroups[0].min;
              targetMax = matchedGroups[0].max;
            } else if (matchedGroups.length > 1) {
              const val = Number(data.result);
              if (data.result !== undefined && data.result !== "" && !isNaN(val)) {
                // Comprobar si entra en ALGUNA de las fases clínicas
                const inAnyGroup = matchedGroups.some((g: any) => {
                  const gMin = g.min !== undefined ? Number(g.min) : -Infinity;
                  const gMax = g.max !== undefined ? Number(g.max) : Infinity;
                  return val >= gMin && val <= gMax;
                });

                if (!inAnyGroup) {
                  const allMins = matchedGroups.map((g: any) => g.min).filter((v: any) => v !== undefined).map(Number);
                  const allMaxs = matchedGroups.map((g: any) => g.max).filter((v: any) => v !== undefined).map(Number);
                  const globalMin = allMins.length > 0 ? Math.min(...allMins) : undefined;
                  const globalMax = allMaxs.length > 0 ? Math.max(...allMaxs) : undefined;

                  if (globalMin !== undefined && val < globalMin) isLow = true;
                  if (globalMax !== undefined && val > globalMax) isHigh = true;
                }
              }
            }
          } else {
            targetMin = ref.min;
            targetMax = ref.max;
          }
        }

        if (data.result !== undefined && data.result !== "") {
          const val = Number(data.result)
          if (!isNaN(val)) {
            if (targetMin !== undefined && targetMax !== undefined) {
              if (val < targetMin) isLow = true
              if (val > targetMax) isHigh = true
            } else if (targetMin !== undefined) {
              if (val < targetMin) isLow = true
            } else if (targetMax !== undefined) {
              if (val > targetMax) isHigh = true
            }
          }
        }

        const refValueProcessed = getRefText(data.refValue)
        const isOdd = simpleRowCount % 2 !== 0
        simpleRowCount++

        return (
          // wrap={false} individual para que cada fila no se divida por la mitad
          <View
            key={entry.catalogId || idx}
            wrap={false}
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
            <Text style={[s.tableCell, { flex: 2 }]}>{entry.testName}</Text>

            <Text style={[s.tableCellBold, { flex: 1 }, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
              {`${data.result || "—"}${isHigh ? " ↑" : isLow ? " ↓" : ""}`}
            </Text>

            <Text style={[s.tableCell, { flex: 1 }]}>{data.unit}</Text>

            {/* RENDERIZADO VERTICAL DE CELDAS CON SALTO DE LÍNEA */}
            <View style={{ flex: 2 }}>
              {Array.isArray(refValueProcessed) ? (
                refValueProcessed.map((line, lineIdx) => (
                  <Text key={lineIdx} style={[s.tableCell, { fontSize: 7.5, marginBottom: 1, color: "#475569" }]}>
                    {line}
                  </Text>
                ))
              ) : (
                <Text style={s.tableCell}>{refValueProcessed}</Text>
              )}
            </View>

            <Text style={[s.tableCell, { flex: 1.5 }]}>{data.method}</Text>
          </View>
        )
      })}
    </View>
  )
}
