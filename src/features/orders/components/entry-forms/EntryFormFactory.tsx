import type { TestEntry } from "@/shared/types"
import SimpleTestForm from "./SimpleTestForm"
import HematologyForm from "./HematologyForm"
import UrinalysisForm from "./UrinalysisForm"
import StoolForm from "./StoolForm"
import CultureForm from "./CultureForm"

interface EntryFormFactoryProps {
  entry: TestEntry
  onChange: (updated: TestEntry) => void
}

const FORM_REGISTRY: Record<string, React.FC<any>> = {
  simple:     SimpleTestForm,
  hematology: HematologyForm,
  urinalysis: UrinalysisForm,
  stool:      StoolForm,
  culture:    CultureForm,
}

export default function EntryFormFactory({ entry, onChange }: EntryFormFactoryProps) {
  const FormComponent = FORM_REGISTRY[entry.format]

  if (!FormComponent) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
        Formato desconocido: <strong>{entry.format}</strong>
      </div>
    )
  }

  return <FormComponent entry={entry} onChange={onChange} />
}
