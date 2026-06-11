import { useState } from "react"
import { collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { Patient } from "@/shared/types"

export function usePatientMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPatient = async (patientData: Omit<Patient, "id" | "createdAt" | "updatedAt">): Promise<Patient | null> => {
    setLoading(true)
    setError(null)
    try {
      // Basic uniqueness check (if we want to prevent dups by nationalId)
      const q = query(collection(db, "patients"), where("nationalId", "==", patientData.nationalId))
      const snap = await getDocs(q)
      if (!snap.empty) {
        throw new Error("Ya existe un paciente con este ID / Cédula.")
      }

      const docRef = await addDoc(collection(db, "patients"), {
        ...patientData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return {
        id: docRef.id,
        ...patientData,
      } as Patient // Note: createdAt/updatedAt will be locally undefined/serverTimestamp, but for UI it's usually fine
    } catch (err: any) {
      console.error("Error creating patient:", err)
      setError(err.message || "Error al registrar el paciente.")
      return null
    } finally {
      setLoading(false)
    }
  }

  const updatePatient = async (id: string, updates: Partial<Patient>): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const docRef = doc(db, "patients", id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return true
    } catch (err: any) {
      console.error("Error updating patient:", err)
      setError(err.message || "Error al actualizar el paciente.")
      return false
    } finally {
      setLoading(false)
    }
  }

  return { createPatient, updatePatient, loading, error }
}
