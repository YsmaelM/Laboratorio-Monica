import { Edit2, Trash2, Search, Loader2, FileText, X } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"
import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import toast from "react-hot-toast"

interface CatalogTableProps {
  items: TestCatalogItem[]
  onEdit: (item: TestCatalogItem) => void
  onDelete: (id: string) => void
}







export default function CatalogTable({ items, onEdit, onDelete }: CatalogTableProps) {

  const [test, setTest] = useState<TestCatalogItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [testToDelete, setTestToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const q = query(
          collection(db, "test_catalog"),
          orderBy("name")
        )
        const snapshot = await getDocs(q)
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TestCatalogItem)
        setTest(fetched)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTests()
  }, [])

  const handleDelete = async () => {
    if (!testToDelete) return
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "test_catalog", testToDelete))
      setTest(prev => prev.filter(o => o.id !== testToDelete))
      toast.success("Test eliminado correctamente")
    } catch (err) {
      console.error("Error deleting test:", err)
      toast.error("Error al eliminar la prueba")
    } finally {
      setIsDeleting(false)
      setTestToDelete(null)
    }
  }




  const filteredTests = test.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  )




  return (

    <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface-900 shadow-xl">
      <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-surface-900/50 px-4 py-2 shadow-inner">
        <Search className="h-5 w-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="ml-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-white/10 bg-white/5 text-white">
          <tr>
            <th className="px-6 py-4 font-medium">Código</th>
            <th className="px-6 py-4 font-medium">Nombre de la Prueba</th>
            <th className="px-6 py-4 font-medium">Formato</th>
            <th className="px-6 py-4 font-medium">Categoría</th>
            <th className="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
                <p className="mt-2 text-white/40">Cargando Pruebas...</p>
              </td>
            </tr>
          ) : filteredTests.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                No se encontraron pruebas.
              </td>
            </tr>
          ) : (filteredTests.map((item) => (
            <tr key={item.name} className="transition hover:bg-white/5">
              <td className="whitespace-nowrap px-6 py-4 font-mono text-white/60">{item.code}</td>
              <td className="px-6 py-4 font-medium">{item.name}</td>
              <td className="px-6 py-4 capitalize">{item.format}</td>
              <td className="px-6 py-4">{item.category}</td>
              <td className="px-6 py-4 text-right">


                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="rounded-lg p-2 text-white/40 hover:bg-primary-500/10 hover:text-primary-400"
                    title="Editar Prueba"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTestToDelete(item.id)
                    }}
                    className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                    title="Eliminar Prueba"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          )))}

          {/* Delete Confirmation Modal */}
          {testToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
                <button
                  onClick={() => setTestToDelete(null)}
                  className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="mb-2 text-lg font-bold text-white">¿Eliminar prueba?</h3>
                <p className="mb-6 text-sm text-white/60">
                  ¿Está seguro que desea eliminar esta prueba? Esta acción no se puede deshacer.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setTestToDelete(null)}
                    disabled={isDeleting}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-glow-primary transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}



          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                No se encontraron pruebas en el catálogo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
