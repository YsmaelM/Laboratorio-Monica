import { Edit2, AlertCircle, Search, Loader2 } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"
import { migrateRefRange } from "../utils/migrateRefRanges"
import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"

interface ReferenceValuesTabProps {
  items: TestCatalogItem[]
  onEdit: (item: TestCatalogItem) => void
}

export default function ReferenceValuesTab({ onEdit }: ReferenceValuesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<TestCatalogItem[]>([])


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



  // Filter for simple format items since only they have simple reference values here


  const filteredTests = test.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderRefValueSummary = (item: TestCatalogItem) => {
    const ref = item.simpleDefaults?.refValue || migrateRefRange(item.simpleDefaults?.refRanges)
    if (!ref) return <span className="text-white/40">Formato Custom</span>

    if (ref.type === "single_point") {
      return <span>Hasta: <strong className="text-primary-400">{ref.max}</strong></span>
    }

    if (ref.type === "two_point") {
      return (
        <span>
          Desde <strong className="text-primary-400">{ref.min}</strong> Hasta <strong className="text-primary-400">{ref.max}</strong>
        </span>
      )
    }

    if (ref.type === "group") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {ref.groups?.map((g, idx) => (
            <span key={idx} className="inline-flex items-center rounded-lg bg-white/5 px-2 py-0.5 text-xs border border-white/5">
              <span className="text-white/60 mr-1">{g.name}:</span>
              {g.type === "two_point" ? (
                <strong className="text-primary-400">{g.min} - {g.max}</strong>
              ) : (
                <span>Hasta <strong className="text-primary-400">{g.max}</strong></span>
              )}
            </span>
          ))}
        </div>
      )
    }

    return <span className="text-white/40">N/A</span>
  }

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
            <th className="px-6 py-4 font-medium">Unidad</th>
            <th className="px-6 py-4 font-medium">Método</th>
            <th className="px-6 py-4 font-medium">Valor de Referencia</th>
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
          ) : filteredTests.map((item) => (
            <tr key={item.id} className="transition hover:bg-white/5">
              <td className="whitespace-nowrap px-6 py-4 font-mono text-white/60">{item.code}</td>
              <td className="px-6 py-4 font-medium">{item.name}</td>
              <td className="px-6 py-4">{item.simpleDefaults?.unit || <span className="text-white/30">—</span>}</td>
              <td className="px-6 py-4">{item.simpleDefaults?.method || <span className="text-white/30">—</span>}</td>
              <td className="px-6 py-4">{renderRefValueSummary(item)}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(item)}
                  className="rounded-lg p-2 text-white/40 hover:bg-primary-500/10 hover:text-primary-400"
                  title="Editar Valores de Referencia"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {filteredTests.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-white/50">
                <div className="flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5 text-white/30" />
                  <span>No se encontraron pruebas.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
