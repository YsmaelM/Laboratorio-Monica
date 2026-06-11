import { useState, useEffect } from "react"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { Patient } from "@/shared/types"

export function usePatientSearch(nationalIdQuery: string) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!nationalIdQuery || nationalIdQuery.length < 3) {
      setPatient(null)
      return
    }

    let isMounted = true
    const searchPatient = async () => {
      setLoading(true)
      setError(null)
      try {
        const q = query(
          collection(db, "patients"),
          where("nationalId", "==", nationalIdQuery),
          limit(1)
        )
        const querySnapshot = await getDocs(q)
        
        if (!isMounted) return

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0]
          setPatient({ id: docSnap.id, ...docSnap.data() } as Patient)
        } else {
          setPatient(null)
        }
      } catch (err: any) {
        console.error("Error searching patient:", err)
        if (isMounted) {
          setError(err.message || "Error searching for patient.")
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    searchPatient()

    return () => {
      isMounted = false
    }
  }, [nationalIdQuery])

  return { patient, loading, error, setPatient }
}
