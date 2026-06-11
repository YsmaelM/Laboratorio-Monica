import { useState, useRef, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import type { TestCatalogItem } from "@/shared/types"

interface TestComboboxProps {
  catalog: TestCatalogItem[]
  onSelect: (item: TestCatalogItem) => void
}

export default function TestCombobox({ catalog, onSelect }: TestComboboxProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Filter out quick actions or keep them? Usually combobox has all tests, but maybe filter out if they are already in quick actions. 
  // For now, let's include all.
  const filteredCatalog = catalog.filter(item => {
    if (!query) return true
    const searchStr = query.toLowerCase()
    return (
      item.name.toLowerCase().includes(searchStr) ||
      item.code.toLowerCase().includes(searchStr) ||
      item.category.toLowerCase().includes(searchStr)
    )
  })

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative mb-8" ref={wrapperRef}>
      <h3 className="mb-4 text-sm font-medium text-white/60">Buscar Pruebas</h3>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar por nombre, código o categoría..."
          className="w-full rounded-xl border border-white/10 bg-surface-800 py-3 pl-12 pr-4 text-white placeholder-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {isOpen && filteredCatalog.length > 0 && (
        <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-surface-800 py-2 shadow-2xl backdrop-blur-xl">
          {filteredCatalog.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item)
                setQuery("")
                setIsOpen(false)
              }}
              className="flex w-full items-center justify-between px-4 py-2 hover:bg-white/5 text-left"
            >
              <div>
                <div className="font-medium text-white">{item.name}</div>
                <div className="text-xs text-white/50">{item.code} • {item.category}</div>
              </div>
              <Plus className="h-4 w-4 text-white/40" />
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query && filteredCatalog.length === 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/10 bg-surface-800 p-4 text-center text-sm text-white/60 shadow-2xl">
          No se encontraron pruebas.
        </div>
      )}
    </div>
  )
}
