
import { SquareUserRound, Search, Trash2, UserPen, Eye, Loader2, SearchX, X, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/shared/lib/firebase"
import type { Patient } from "@/shared/types"
import PatientCardList from "@/features/patients/components/PatientCardList"
import QuickRegisterModal from "@/features/patients/components/QuickRegisterModal"
import toast from "react-hot-toast"


export default function PatiensListPage() {

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [watchPatien, setWatchPatien] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)

  // Modal edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "patients"),
          orderBy("firstName")
        )
        const snapshot = await getDocs(q)
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Patient)
        setPatients(fetched)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const handleDelete = async () => {
    if (!patientToDelete) return
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "patients", patientToDelete))
      setPatients(prev => prev.filter(o => o.id !== patientToDelete))
      toast.success("Paciente eliminado correctamente")
    } catch (err) {
      console.error("Error deleting patient:", err)
      toast.error("Error al eliminar el paciente")
    } finally {
      setIsDeleting(false)
      setPatientToDelete(null)
    }
  }
  const handleCreate = () => {
    setEditingPatient(undefined)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = (updatedPatient: Patient) => {
    setPatients(prev => {
      const exists = prev.some(p => p.id === updatedPatient.id)
      if (exists) {
        return prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
      } else {
        // It's a new patient, add them to the list (keeping alphabetical order by firstName)
        const updatedList = [...prev, updatedPatient]
        return updatedList.sort((a, b) => a.firstName.localeCompare(b.firstName))
      }
    })
    toast.success("Paciente guardado correctamente")
  }

  const filteredPatients = patients.filter(patients =>
    patients.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patients.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patients.nationalId.includes(searchTerm)
  )



  return (
    <div className="mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <SquareUserRound className="h-6 w-6 text-primary-400" />
            Lista de Pacientes
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Administra a los pacientes, añade, elimina, busca, edita pacientes.
          </p>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="mb-6 flex flex w-full gap-4 items-center rounded-xl border border-white/10 bg-surface-900/50 px-4 py-2 shadow-inner">
        <Search className="h-5 w-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="ml-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />

        <button
          onClick={handleCreate}
          className=" flex w-1/4 flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-glow-primary transition hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          <span className="flex-1">Nuevo Paciente</span>
        </button>

      </div>

      {/* Renderizado Condicional del Detalle del Paciente */}
      {selectedPatient && watchPatien && (
        <PatientCardList
          patient={selectedPatient}
          onClear={() => {
            setWatchPatien(false);;
          }}
        />
      )}

      {/* Control del Estado de Carga */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-900/50 shadow-xl backdrop-blur-sm p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-2 text-white/40">Cargando historial...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        /* Control de Lista Vacía */
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-900/50 shadow-xl backdrop-blur-sm p-12 text-center text-white/40">
          <SearchX className="mx-auto h-8 w-8 text-white/40" />
          <p className="mt-2">No se encontraron pacientes.</p>
        </div>
      ) : (
        /* Renderizado de la Tabla Principal si tablePatient es true */

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-900/50 shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white">
              <thead className="border-b border-white/10 bg-white/5 text-xs font-semibold text-white/60">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Cédula</th>
                  <th className="px-6 py-4">Edad</th>
                  <th className="px-6 py-4">Telefono</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPatients.map(patient => (
                  <tr key={patient.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 font-medium">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {patient.nationalId}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {patient.age}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {patient.phone}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setWatchPatien(true);

                          }}
                          className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:border-green-500 hover:bg-green-500/10 hover:text-green-400"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPatient(patient)
                            setIsEditModalOpen(true)
                          }}
                          className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:border-primary-500 hover:bg-primary-500/10 hover:text-primary-400"
                        >
                          <UserPen className="h-4 w-4" />
                        </button>
                        <button onClick={() => setPatientToDelete(patient.id)}
                          disabled={isDeleting} className="cursor-pointer rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-400 transition hover:border-red-500 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      )}


      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl">
            <button
              onClick={() => setPatientToDelete(null)}
              className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-2 text-lg font-bold text-white">¿Eliminar orden?</h3>
            <p className="mb-6 text-sm text-white/60">
              ¿Está seguro que desea eliminar este paciente? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setPatientToDelete(null)}
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

      {/* Edit Patient Modal */}
      <QuickRegisterModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPatient(undefined)
        }}
        initialPatient={editingPatient}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}