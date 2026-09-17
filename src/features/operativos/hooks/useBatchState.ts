import { useState, useMemo, useCallback } from "react"
import type { Patient, TestEntry, BatchEntry } from "@/shared/types"

export function useBatchState(templateTests: TestEntry[]) {
  const [patients, setPatients] = useState<BatchEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const addPatient = useCallback((patient: Patient) => {
    setPatients((prev) => {
      if (prev.some((p) => p.patientId === patient.id)) return prev
      
      const newEntry: BatchEntry = {
        patientId: patient.id,
        patient: {
          patientId: patient.id,
          nationalId: patient.nationalId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          age: patient.age,
          sex: patient.sex,
        },
        tests: templateTests.map((t) => ({
          ...JSON.parse(JSON.stringify(t)), // Deep copy para evitar mutación compartida
          status: "pending",
        })),
        isComplete: false,
      }
      return [...prev, newEntry]
    })
  }, [templateTests])

  const removePatient = useCallback((patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.patientId !== patientId))
  }, [])

  const updatePatientTests = useCallback((patientId: string, tests: TestEntry[]) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.patientId !== patientId) return p
        // Validar si todos los tests tienen resultado
        const isComplete = tests.every((t) => {
          if (t.format === "simple") {
            return t.data.result !== undefined && t.data.result !== ""
          }
          if (t.format === "culture") {
            return t.data.cultureResult !== undefined && t.data.cultureResult !== ""
          }
          if (t.format === "custom") {
            // Chequear si hay al menos algún valor ingresado en data
            return Object.keys(t.data).length > 0
          }
          return false
        })

        return {
          ...p,
          tests,
          isComplete,
        }
      })
    )
  }, [])

  const applyResultToAll = useCallback((baseTests: TestEntry[]) => {
    setPatients((prev) =>
      prev.map((p) => {
        const copiedTests = baseTests.map((t) => ({
          ...JSON.parse(JSON.stringify(t)),
          status: "entered" as const,
        }))
        return {
          ...p,
          tests: copiedTests,
          isComplete: true,
        }
      })
    )
  }, [])

  const addBatchPatients = useCallback((newPatients: Patient[], withResult: boolean, resultTests: TestEntry[]) => {
    setPatients((prev) => {
      const existing = new Set(prev.map((p) => p.patientId))
      const newEntries: BatchEntry[] = newPatients
        .filter((p) => !existing.has(p.id))
        .map((patient) => ({
          patientId: patient.id,
          patient: {
            patientId: patient.id,
            nationalId: patient.nationalId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            age: patient.age,
            sex: patient.sex,
          },
          tests: (withResult ? resultTests : templateTests).map((t) => ({
            ...JSON.parse(JSON.stringify(t)),
            status: withResult ? ("entered" as const) : ("pending" as const),
          })),
          isComplete: withResult,
        }))
      return [...prev, ...newEntries]
    })
  }, [templateTests])

  // Paginación y filtrado
  const totalCount = patients.length
  const completedCount = useMemo(() => patients.filter((p) => p.isComplete).length, [patients])
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return patients.slice(start, start + pageSize)
  }, [patients, currentPage])

  return {
    patients,
    paginatedPatients,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    completedCount,
    addPatient,
    addBatchPatients,
    removePatient,
    updatePatientTests,
    applyResultToAll,
    setPatients,
  }
}
