import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { OrderResult } from "@/shared/types"
import { Loader2, FileText, Search } from "lucide-react"

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

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

  const filteredOrders = orders.filter(order => 
    order.patientSnapshot.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientSnapshot.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientSnapshot.nationalId.includes(searchTerm)
  )

  return (
    <div className="mx-auto max-w-6xl py-6">
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
                      {order.createdAt?.toDate().toLocaleDateString()}
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
                      {order.pdfUrl ? (
                        <a
                          href={order.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                        >
                          <FileText className="h-4 w-4" />
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-xs text-white/30">Sin PDF</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
