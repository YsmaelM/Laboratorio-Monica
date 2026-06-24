import { useState } from "react"
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"

interface DropdownOptionsEditorProps {
  options: string[]
  onChange: (options: string[]) => void
}

export default function DropdownOptionsEditor({ options, onChange }: DropdownOptionsEditorProps) {
  const [newOption, setNewOption] = useState("")

  const addOption = () => {
    const trimmed = newOption.trim()
    if (!trimmed || options.includes(trimmed)) return
    onChange([...options, trimmed])
    setNewOption("")
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  const moveOption = (index: number, direction: "up" | "down") => {
    const next = [...options]
    const swap = direction === "up" ? index - 1 : index + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {/* Existing options */}
      {options.length === 0 && (
        <p className="text-xs text-white/40 italic">Sin opciones aún. Agrega opciones abajo.</p>
      )}
      <ul className="space-y-1.5">
        {options.map((opt, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5"
          >
            <span className="flex-1 text-sm text-white">{opt}</span>
            <button
              type="button"
              onClick={() => moveOption(i, "up")}
              disabled={i === 0}
              className="rounded p-0.5 text-white/40 hover:text-white disabled:opacity-20"
              title="Subir"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => moveOption(i, "down")}
              disabled={i === options.length - 1}
              className="rounded p-0.5 text-white/40 hover:text-white disabled:opacity-20"
              title="Bajar"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => removeOption(i)}
              className="rounded p-0.5 text-red-400/60 hover:text-red-400"
              title="Eliminar opción"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Add new option */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addOption()
            }
          }}
          placeholder="Nueva opción..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={addOption}
          disabled={!newOption.trim()}
          className="flex items-center gap-1 rounded-lg bg-primary-600/20 px-3 py-1.5 text-xs font-medium text-primary-400 hover:bg-primary-600/40 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>
    </div>
  )
}
