import { useState } from "react"
import { doc, collection, addDoc, updateDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { TestCatalogItem } from "@/shared/types"

export function useCatalogMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addCatalogItem = async (item: Omit<TestCatalogItem, "id">) => {
    setLoading(true)
    setError(null)
    try {
      const docRef = await addDoc(collection(db, "test_catalog"), item)
      return { ...item, id: docRef.id } as TestCatalogItem
    } catch (err: any) {
      setError(err.message || "Error al agregar la prueba")
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateCatalogItem = async (id: string, updates: Partial<TestCatalogItem>) => {
    setLoading(true)
    setError(null)
    try {
      const docRef = doc(db, "test_catalog", id)
      await updateDoc(docRef, updates)
      return true
    } catch (err: any) {
      setError(err.message || "Error al actualizar la prueba")
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteCatalogItem = async (id: string) => {
    // Soft delete: set active = false
    return updateCatalogItem(id, { active: false })
  }

  return { addCatalogItem, updateCatalogItem, deleteCatalogItem, loading, error }
}
