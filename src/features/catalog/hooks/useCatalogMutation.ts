import { useState } from "react"
import { doc, collection, addDoc, updateDoc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { TestCatalogItem } from "@/shared/types"

function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined)
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, val]) => {
      if (val !== undefined) {
        acc[key] = removeUndefined(val)
      }
      return acc
    }, {} as any)
  }
  return obj
}

export function useCatalogMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addCatalogItem = async (item: Omit<TestCatalogItem, "id">) => {
    setLoading(true)
    setError(null)
    try {
      const cleanedItem = removeUndefined(item)
      const docRef = await addDoc(collection(db, "test_catalog"), cleanedItem)
      return { ...cleanedItem, id: docRef.id } as TestCatalogItem
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
      const cleanedUpdates = removeUndefined(updates)
      const docRef = doc(db, "test_catalog", id)
      await updateDoc(docRef, cleanedUpdates)
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
