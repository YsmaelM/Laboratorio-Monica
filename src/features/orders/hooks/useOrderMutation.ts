import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import { useAuth } from "@/app/providers/AuthProvider"
import type { Patient, TestEntry, OrderResult, PatientSnapshot } from "@/shared/types"
import { Timestamp } from "firebase/firestore"

export function useOrderMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const saveOrder = async (
    patient: Patient,
    tests: TestEntry[],
    referringDoctor?: string
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const patientSnapshot: PatientSnapshot = {
        patientId: patient.id,
        nationalId: patient.nationalId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        sex: patient.sex,
      }

      const orderData: Omit<OrderResult, "id"> = {
        patientId: patient.id,
        patientSnapshot,
        orderDate: Timestamp.now(),
        status: "completed",
        tests,
        createdBy: user?.uid || "unknown",
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
      }

      if (referringDoctor?.trim()) {
        orderData.referringDoctor = referringDoctor.trim()
      }

      // Clean undefined values from nested objects to avoid Firestore errors
      const cleanedData = JSON.parse(JSON.stringify(orderData))

      const docRef = await addDoc(collection(db, "orders_results"), {
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    } catch (err: any) {
      console.error("Error saving order:", err)
      setError(err.message || "Error al guardar la orden")
      return null
    } finally {
      setLoading(false)
    }
  }

  return { saveOrder, loading, error }
}
