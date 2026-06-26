import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { OrderResult } from "@/shared/types"
import { Loader2, FileText, Search, Trash2, X } from "lucide-react"
import toast from "react-hot-toast"
import { formatDate } from "@/shared/lib/utils"

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders_results"),
          orderBy("createdAt", "desc"),
          limit(50)
        )
        const snapshot = await getDocs(q)
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as OrderResult)
        setOrders(fetched)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const handleDelete = async () => {
    if (!orderToDelete) return
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "orders_results", orderToDelete))
      setOrders(prev => prev.filter(o => o.id !== orderToDelete))
      toast.success("Orden eliminada correctamente")
    } catch (err) {
      console.error("Error deleting order:", err)
      toast.error("Error al eliminar la orden")
    } finally {
      setIsDeleting(false)
      setOrderToDelete(null)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.patientSnapshot.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientSnapshot.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientSnapshot.nationalId.includes(searchTerm)
  )

  return (
    <div className="mx-auto max-w-6xl py-6 relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Órdenes</h1>
          <p className="mt-1 text-sm text-white/60">Últimas 50 órdenes registradas en el sistema</p>
        </div>
      </div>

      <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-surface-900/50 px-4 py-2 shadow-inner">
        <Search className="h-5 w-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="ml-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-900/50 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white">
            <thead className="border-b border-white/10 bg-white/5 text-xs font-semibold text-white/60">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Cédula</th>
                <th className="px-6 py-4">Pruebas</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
                    <p className="mt-2 text-white/40">Cargando historial...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                    No se encontraron órdenes.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-white/80">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {order.patientSnapshot.firstName} {order.patientSnapshot.lastName}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {order.patientSnapshot.nationalId}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {order.tests.length} prueba(s)
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "reported" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {order.status === "reported" ? "Reportado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.pdfUrl ? (
                          <a
                            href={order.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-blue-500/10 p-1.5 text-blue-400 transition hover:bg-blue-500/20"
                            title="Ver PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-white/30 px-2 py-1.5">Sin PDF</span>
                        )}
                        <a
                          href={`/newOrder?edit=${order.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                          title="Editar orden"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </a>
                        <button
                          onClick={() => setOrderToDelete(order.id)}
                          className="inline-flex items-center justify-center rounded-lg bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                          title="Eliminar orden"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
            <button
              onClick={() => setOrderToDelete(null)}
              className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-2 text-lg font-bold text-white">¿Eliminar orden?</h3>
            <p className="mb-6 text-sm text-white/60">
              ¿Está seguro que desea eliminar este reporte? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setOrderToDelete(null)}
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
    </div>
  )
}
