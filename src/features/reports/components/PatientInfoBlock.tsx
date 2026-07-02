import { View, Text } from "@react-pdf/renderer"
import { s } from "../styles/pdfStyles"
import type { PatientSnapshot } from "@/shared/types"
import { Timestamp } from "firebase/firestore"

interface PatientInfoBlockProps {
  patient: PatientSnapshot
  orderDate: Date
  referringDoctor?: string
}

export function PatientInfoBlock({ patient, orderDate, referringDoctor }: PatientInfoBlockProps) {
  // Calculate age approximation - safely handle Timestamp, plain object or direct age
  let age = patient.age || 0
  if (!age && patient.dateOfBirth) {
    try {
      const raw = patient.dateOfBirth
      const dob = raw instanceof Timestamp
        ? raw.toDate()
        : typeof raw === "object" && raw !== null && "seconds" in raw
          ? new Date((raw as any).seconds * 1000)
          : new Date(raw as any)
      const ageDifMs = Date.now() - dob.getTime()
      const ageDate = new Date(ageDifMs)
      age = Math.abs(ageDate.getUTCFullYear() - 1970)
    } catch {
      age = 0
    }
  }

  const dateStr = orderDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <View style={s.patientBlock}>
      <View style={s.patientCol}>
        <Text style={s.patientLabel}>Paciente</Text>
        <Text style={s.patientValue}>{patient.firstName} {patient.lastName}</Text>

        <Text style={s.patientLabel}>ID / Cédula</Text>
        <Text style={s.patientValue}>{patient.nationalId}</Text>
      </View>

      <View style={s.patientCol}>
        <Text style={s.patientLabel}>Edad / Sexo</Text>
        <Text style={s.patientValue}>
          {age} años / {patient.sex === "M" ? "Masculino" : "Femenino"}
        </Text>

        <Text style={s.patientLabel}>Médico Referente</Text>
        <Text style={s.patientValue}>{referringDoctor || "N/A"}</Text>
      </View>

      <View style={s.patientCol}>
        <Text style={s.patientLabel}>Fecha de Orden</Text>
        <Text style={s.patientValue}>{dateStr}</Text>
        {/* 
        <Text style={s.patientLabel}>Hora</Text>
        <Text style={s.patientValue}>{timeStr}</Text> */}
      </View>
    </View>
  )
}
