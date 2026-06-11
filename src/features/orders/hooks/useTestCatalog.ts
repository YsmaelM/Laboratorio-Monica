import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { TestCatalogItem } from "@/shared/types"

export function useTestCatalog() {
  const [catalog, setCatalog] = useState<TestCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchCatalog = async () => {
      try {
        setLoading(true)
        const q = collection(db, "test_catalog")
        const snap = await getDocs(q)
        
        const items = snap.docs
          .map(doc => ({ ...doc.data(), id: doc.id }) as TestCatalogItem)
          .filter(item => item.active)
          .sort((a, b) => a.order - b.order)

        if (mounted) {
          setCatalog(items)
          setError(null)
        }
      } catch (err: any) {
        console.error("Error fetching test catalog:", err)
        if (mounted) {
          setError(err.message || "Error al cargar el catálogo de pruebas")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchCatalog()

    return () => {
      mounted = false
    }
  }, [])

  return { catalog, loading, error }
}
