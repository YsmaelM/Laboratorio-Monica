import { View, Text } from "@react-pdf/renderer"
import { s } from "../../styles/pdfStyles"
import type { SimpleTestEntry, ReferenceValue, PatientSnapshot } from "@/shared/types"

interface GroupedSimplePdfSectionProps {
  entries: SimpleTestEntry[]
  patient?: PatientSnapshot
}

export function GroupedSimplePdfSection({ entries, patient }: GroupedSimplePdfSectionProps) {
  if (entries.length === 0) return null

  // ── 1. MODIFICADO: SIEMPRE RETORNA EL DESGLOSE COMPLETO EN LISTA VERTICAL ──
  const getRefText = (refValue: any) => {
    if (!refValue) return "-"
    if (typeof refValue === "string") return refValue

    const ref = refValue as ReferenceValue

    if (ref.type === "group" && Array.isArray(ref.groups)) {
      // Eliminamos el buscador de grupo único para este texto visual.
      // Ahora, siempre va a retornar la lista completa de renglones para que se listen hacia abajo:
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

  return (
    <View wrap={false} style={{ marginTop: 10 }}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Pruebas de laboratorio:</Text>
      </View>

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderText, { flex: 2 }]}>Prueba</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Resultado</Text>
        <Text style={[s.tableHeaderText, { flex: 1 }]}>Unidad</Text>
        <Text style={[s.tableHeaderText, { flex: 2 }]}>Val. Ref.</Text>
        <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Método</Text>
      </View>

      {entries.map((entry, idx) => {
        const { data } = entry

        let isHigh = false
        let isLow = false

        let targetMin: number | undefined = undefined
        let targetMax: number | undefined = undefined

        // ── 2. EL RADAR DE ALERTAS SE QUEDA ACTIVO EN SILENCIO ──
        // Aunque imprimamos todo el desglose abajo, el motor sigue buscando el rango del paciente 
        // para saber si debe pintar las flechas ↑ o ↓ de forma matemática
        if (data.refValue && typeof data.refValue !== "string") {
          const ref = data.refValue as ReferenceValue

          if (ref.type === "group" && Array.isArray(ref.groups) && patient) {
            const pAge = patient.age ?? 0;
            const pSex = (patient.sex || "").toUpperCase();

            const matchedGroup = ref.groups.find((g: any) => {
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

            if (matchedGroup) {
              targetMin = matchedGroup.min;
              targetMax = matchedGroup.max;
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

        return (
          <View key={entry.catalogId || idx} style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 2 }]}>{entry.testName}</Text>

            <Text style={[s.tableCellBold, { flex: 1 }, isHigh ? s.flagHigh : isLow ? s.flagLow : {}]}>
              {`${data.result || "—"}${isHigh ? " ↑" : isLow ? " ↓" : ""}`}
            </Text>

            <Text style={[s.tableCell, { flex: 1 }]}>{data.unit}</Text>

            {/* ── 3. RENDERIZADO VERTICAL DE CELDAS CON SALTO DE LÍNEA ── */}
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
