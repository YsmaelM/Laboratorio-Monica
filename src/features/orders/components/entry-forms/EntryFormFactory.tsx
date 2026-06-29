import type { TestEntry } from "@/shared/types"
import SimpleTestForm from "./SimpleTestForm"
import HematologyForm from "./HematologyForm"
import UrinalysisForm from "./UrinalysisForm"
import StoolForm from "./StoolForm"
import CultureForm from "./CultureForm"
import CustomTestForm from "./CustomTestForm"

interface EntryFormFactoryProps {
  entry: TestEntry
  onChange: (updated: TestEntry) => void
  patient: any
}

export default function EntryFormFactory({ entry, onChange, patient }: EntryFormFactoryProps) {
  switch (entry.format) {
    case "simple":
      return <SimpleTestForm entry={entry} onChange={onChange} />
    case "hematology":
      return <HematologyForm entry={entry} onChange={onChange} />
    case "urinalysis":
      return <UrinalysisForm entry={entry} onChange={onChange} />
    case "stool":
      return <StoolForm entry={entry} onChange={onChange} />
    case "culture":
      return <CultureForm entry={entry} onChange={onChange} />
    case "custom":
      return <CustomTestForm entry={entry} onChange={onChange} patient={patient} />
    default:
      return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          Formato desconocido: <strong>{(entry as any).format}</strong>
        </div>
      )
  }
}
