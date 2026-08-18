import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { db, storage } from "@/shared/lib/firebase"
import type { OrderResult, BatchOperation } from "@/shared/types"
import { Loader2, FileText, Search, Trash2, X, Users, ClipboardList } from "lucide-react"
import toast from "react-hot-toast"
import { formatDate } from "@/shared/lib/utils"

export default function OrderHistoryPage() {
  const [activeTab, setActiveTab] = useState<"cotidianas" | "operativos">("cotidianas")
  const [orders, setOrders] = useState<OrderResult[]>([])
  const [batches, setBatches] = useState<BatchOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null)
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<BatchOperation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      if (activeTab === "cotidianas") {
        const q = query(
          collection(db, "orders_results"),
          orderBy("createdAt", "desc"),
          limit(50)
        )
        const snapshot = await getDocs(q)
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as OrderResult)
        setOrders(fetched)
      } else {
        const q = query(
          collection(db, "batch_operations"),
          orderBy("createdAt", "desc"),
          limit(50)
        )
        const snapshot = await getDocs(q)
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as BatchOperation)
        setBatches(fetched)
      }
    } catch (err) {
      console.error("Error fetching history:", err)
      toast.error("Error al cargar el historial")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [activeTab])

  const handleDelete = async () => {
    if (!orderToDelete) return
    setIsDeleting(true)
    try {
      const targetOrder = orders.find(o => o.id === orderToDelete)

      if (targetOrder && targetOrder.pdfUrl) {
        try {
          const decodedUrl = decodeURIComponent(targetOrder.pdfUrl);
          const pathStart = decodedUrl.indexOf("/o/") + 3;
          const pathEnd = decodedUrl.indexOf("?alt=media");
          const storagePath = decodedUrl.substring(pathStart, pathEnd);

          const fileRef = ref(storage, storagePath)
          await deleteObject(fileRef)
          console.log("PDF físico eliminado de Storage con éxito.");
        } catch (storageErr) {
          console.warn("No se pudo eliminar el archivo físico de Storage:", storageErr)
        }
      }

      await deleteDoc(doc(db, "orders_results", orderToDelete))
      setOrders(prev => prev.filter(o => o.id !== orderToDelete))
      toast.success("Orden e informe eliminados correctamente")
    } catch (err) {
      console.error("Error deleting order:", err)
      toast.error("Error al eliminar la orden")
    } finally {
      setIsDeleting(false)
      setOrderToDelete(null)
    }
  }

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return
    setIsDeleting(true)
    try {
      const targetBatch = batches.find(b => b.id === batchToDelete)

      if (targetBatch && targetBatch.pdfUrl) {
        try {
          const decodedUrl = decodeURIComponent(targetBatch.pdfUrl);
          const pathStart = decodedUrl.indexOf("/o/") + 3;
          const pathEnd = decodedUrl.indexOf("?alt=media");
          const storagePath = decodedUrl.substring(pathStart, pathEnd);

          const fileRef = ref(storage, storagePath)
          await deleteObject(fileRef)
          console.log("PDF físico de lote eliminado de Storage con éxito.");
        } catch (storageErr) {
          console.warn("No se pudo eliminar el archivo físico de lote de Storage:", storageErr)
        }
      }

      await deleteDoc(doc(db, "batch_operations", batchToDelete))
      setBatches(prev => prev.filter(b => b.id !== batchToDelete))
      toast.success("Operativo eliminado correctamente")
    } catch (err) {
      console.error("Error deleting batch operation:", err)
      toast.error("Error al eliminar el operativo")
    } finally {
      setIsDeleting(false)
      setBatchToDelete(null)
    }
  }

  const filteredOrders = orders.filter(order =>
    order.patientSnapshot.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientSnapshot.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientSnapshot.nationalId.includes(searchTerm)
  )

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.referringDoctor && batch.referringDoctor.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="mx-auto max-w-6xl py-6 relative px-4">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Órdenes</h1>
          <p className="mt-1 text-sm text-white/60">Últimos registros del laboratorio en el sistema</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 shrink-0">
          <button
            onClick={() => {
              setActiveTab("cotidianas")
              setSearchTerm("")
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "cotidianas"
                ? "bg-primary-600 text-white shadow-glow-primary"
                : "text-white/60 hover:text-white"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Órdenes Cotidianas
          </button>
          <button
            onClick={() => {
              setActiveTab("operativos")
              setSearchTerm("")
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "operativos"
                ? "bg-primary-600 text-white shadow-glow-primary"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            Operativos Masivos
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-surface-900/50 px-4 py-2 shadow-inner">
        <Search className="h-5 w-5 text-white/40" />
        <input
          type="text"
          placeholder={
            activeTab === "cotidianas"
              ? "Buscar por nombre de paciente o cédula..."
              : "Buscar por nombre de operativo o médico..."
          }
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="ml-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-900/50 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          {activeTab === "cotidianas" ? (
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
                      No se encontraron órdenes cotidianas.
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
                          <Link
                            to={`/newOrder?edit=${order.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                            title="Editar orden"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                          </Link>
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
          ) : (
            <table className="w-full text-left text-sm text-white">
              <thead className="border-b border-white/10 bg-white/5 text-xs font-semibold text-white/60">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Operativo</th>
                  <th className="px-6 py-4">Pruebas</th>
                  <th className="px-6 py-4 text-center">Pacientes</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
                      <p className="mt-2 text-white/40">Cargando operativos...</p>
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                      No se encontraron operativos.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => (
                    <tr key={batch.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-white/80">
                        {formatDate(batch.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {batch.name}
                      </td>
                      <td className="px-6 py-4 text-white/60 font-medium">
                        {batch.templateTests.map(t => t.testName).join(", ")}
                      </td>
                      <td className="px-6 py-4 text-center text-white/60">
                        <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-400 border border-primary-500/20">
                          {batch.entries.length} paciente(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBatchDetail(batch)}
                            className="inline-flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                            title="Ver detalles del operativo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          {batch.pdfUrl ? (
                            <a
                              href={batch.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-lg bg-blue-500/10 p-1.5 text-blue-400 transition hover:bg-blue-500/20"
                              title="Ver PDF Consolidado"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-xs text-white/30 px-2 py-1.5">Sin PDF</span>
                          )}
                          <Link
                            to={`/operativos?edit=${batch.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                            title="Editar operativo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                          </Link>
                          <button
                            onClick={() => setBatchToDelete(batch.id || null)}
                            className="inline-flex items-center justify-center rounded-lg bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                            title="Eliminar operativo"
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
          )}
        </div>
      </div>

      {/* Modal interactivo de Detalles del Operativo (Ver) */}
      {selectedBatchDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedBatchDetail(null)}
              className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">{selectedBatchDetail.name}</h3>
              <p className="text-xs text-white/40 mt-1">
                Médico Referente: {selectedBatchDetail.referringDoctor || "N/A"} | Creado: {formatDate(selectedBatchDetail.createdAt)}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-primary-400">Pacientes y Resultados del Lote</h4>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-950">
                <table className="w-full text-left text-xs text-white">
                  <thead className="border-b border-white/10 bg-white/5 font-semibold text-white/60">
                    <tr>
                      <th className="px-4 py-2.5">Paciente</th>
                      <th className="px-4 py-2.5">Cédula</th>
                      <th className="px-4 py-2.5">Resultados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedBatchDetail.entries.map((entry) => (
                      <tr key={entry.patientId} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-2.5 font-medium">{entry.patient.firstName} {entry.patient.lastName}</td>
                        <td className="px-4 py-2.5 font-mono text-white/60">{entry.patient.nationalId}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col gap-1">
                            {entry.tests.map((t) => {
                              let displayVal = "—"
                              if (t.format === "simple") {
                                displayVal = String(t.data.result || "—")
                              } else if (t.format === "culture") {
                                displayVal = String(t.data.cultureResult || "—")
                              } else if (t.format === "custom") {
                                // Mostrar primer campo no vacío o cantidad
                                const keys = Object.keys(t.data)
                                displayVal = keys.length > 0 ? `${keys.length} campo(s) ingresado(s)` : "Vacío"
                              }
                              return (
                                <span key={t.catalogId} className="text-[11px]">
                                  <strong className="text-white/60">{t.testName}:</strong> {displayVal}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
              {selectedBatchDetail.pdfUrl && (
                <a
                  href={selectedBatchDetail.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 px-5 py-2 text-sm font-medium text-white/80 hover:bg-white/10 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Ver PDF
                </a>
              )}
              <button
                onClick={() => setSelectedBatchDetail(null)}
                className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-glow-primary hover:bg-primary-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
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
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
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

      {/* Delete Batch Confirmation Modal */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
            <button
              onClick={() => setBatchToDelete(null)}
              className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-2 text-lg font-bold text-white">¿Eliminar operativo?</h3>
            <p className="mb-6 text-sm text-white/60">
              ¿Está seguro que desea eliminar este operativo y su PDF consolidado? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setBatchToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBatch}
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
