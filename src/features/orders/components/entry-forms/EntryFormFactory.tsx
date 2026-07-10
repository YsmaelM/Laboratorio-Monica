import type { TestEntry } from "@/shared/types"
import SimpleTestForm from "./SimpleTestForm"
import CultureForm from "./CultureForm"
import CustomTestForm from "./CustomTestForm"

interface EntryFormFactoryProps {
  entry: TestEntry
  onChange: (updated: TestEntry) => void
  patient: any
  onNext?: () => void
}

export default function EntryFormFactory({ entry, onChange, patient, onNext }: EntryFormFactoryProps) {
  switch (entry.format) {
    case "simple":
      return <SimpleTestForm entry={entry} onChange={onChange} patient={patient} onNext={onNext} />
    case "culture":
      return <CultureForm entry={entry} onChange={onChange} />
    case "custom":
      return <CustomTestForm entry={entry} onChange={onChange} patient={patient} onNext={onNext} />
    default:
      return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          Formato desconocido: <strong>{(entry as any).format}</strong>
        </div>
      )
  }
}
