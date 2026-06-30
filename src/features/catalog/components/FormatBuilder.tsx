import { useState, useCallback } from "react"

const uid = () => crypto.randomUUID()
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  AlignLeft, Hash, List, BookOpen, Minus,
  GripVertical, Settings2, Eye, EyeOff, Calculator,
} from "lucide-react"
import type {
  CustomFormatTemplate, FormatRow, FormatColumn,
  EmptyRow, HeaderRow, TestRow, SimpleRow,
} from "@/shared/types"
import DropdownOptionsEditor from "./DropdownOptionsEditor"
import FormatPreview from "./FormatPreview"
import ReferenceValuesEditor from "./ReferenceValuesEditor"

interface FormatBuilderProps {
  value: CustomFormatTemplate
  onChange: (template: CustomFormatTemplate) => void
  formatName?: string
}

// ─── Column type meta ────────────────────────────────────────────────────────
const COL_TYPE_OPTIONS = [
  { value: "text", label: "Texto", icon: AlignLeft },
  { value: "number", label: "Número", icon: Hash },
  { value: "select", label: "Desplegable", icon: List },
  { value: "reference", label: "Referencia", icon: BookOpen },
  { value: "unit", label: "Unidad", icon: Minus },
  { value: "formula", label: "Fórmula (Auto)", icon: Calculator },
] as const

type ColType = typeof COL_TYPE_OPTIONS[number]["value"]

const COL_TYPE_COLORS: Record<ColType, string> = {
  text: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  number: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  select: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  reference: "bg-primary-500/10 text-primary-400 border-primary-500/20",
  unit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  formula: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
}

// ─── Row creators ─────────────────────────────────────────────────────────────
const makeEmpty = (): EmptyRow => ({ id: uid(), type: "empty" })
const makeHeader = (): HeaderRow => ({ id: uid(), type: "header", text: "" })
const makeTest = (): TestRow => ({ id: uid(), type: "test", columns: [] })
const makeSimple = (): SimpleRow => ({ id: uid(), type: "simple", columns: [] })
const makeColumn = (): FormatColumn => ({
  id: uid(),
  label: "",
  type: "text",
  width: 1,
})

// ─── Column Editor ────────────────────────────────────────────────────────────
interface ColumnEditorProps {
  col: FormatColumn
  colIndex: number
  colCount: number
  onUpdate: (col: FormatColumn) => void
  onRemove: () => void
  onMove: (dir: "left" | "right") => void
}

function ColumnEditor({ col, colIndex, colCount, onUpdate, onRemove, onMove }: ColumnEditorProps) {
  const [showOptions, setShowOptions] = useState(false)
  const typeColors = COL_TYPE_COLORS[col.type as ColType] || "bg-white/5 text-white/60 border-white/10"

  return (
    <div className="rounded-xl border border-white/10 bg-surface-800 p-3 space-y-2.5">
      {/* Column header controls */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-white/20 shrink-0" />
        <div className={`rounded-md border px-2 py-0.5 text-xs font-medium ${typeColors}`}>
          #{colIndex + 1}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onMove("left")}
          disabled={colIndex === 0}
          className="rounded p-0.5 text-white/30 hover:text-white disabled:opacity-20"
          title="Mover izquierda"
        >
          <ChevronUp className="h-3.5 w-3.5 rotate-[-90deg]" />
        </button>
        <button
          type="button"
          onClick={() => onMove("right")}
          disabled={colIndex === colCount - 1}
          className="rounded p-0.5 text-white/30 hover:text-white disabled:opacity-20"
          title="Mover derecha"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-red-400/50 hover:text-red-400"
          title="Eliminar columna"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Label */}
      <input
        type="text"
        value={col.label}
        onChange={(e) => onUpdate({ ...col, label: e.target.value })}
        placeholder="Nombre de la columna..."
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* Type selector */}
      <select
        value={col.type}
        onChange={(e) => {
          const newType = e.target.value as FormatColumn["type"]
          const isFixedDefault = newType === "reference" || newType === "unit"
          onUpdate({
            ...col,
            type: newType,
            isFixed: isFixedDefault ? true : col.isFixed,
            options: newType === "select" ? [] : undefined
          })
        }}
        className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
      >
        {COL_TYPE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-surface-900">
            {opt.label}
          </option>
        ))}
      </select>

      {/* Width */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40 shrink-0">Ancho:</span>
        <input
          type="range"
          min={1}
          max={6}
          value={col.width ?? 1}
          onChange={(e) => onUpdate({ ...col, width: Number(e.target.value) })}
          className="flex-1 accent-primary-500"
        />
        <span className="w-4 text-right text-xs text-white/60">{col.width ?? 1}</span>
      </div>

      {/* Default value & isFixed option */}
      <div className="space-y-2 border-t border-white/5 pt-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`headerOnly-${col.id}`}
            checked={col.isHeaderOnly ?? false}
            onChange={(e) => {
              const checked = e.target.checked
              onUpdate({
                ...col,
                isHeaderOnly: checked,
                isFixed: checked ? false : col.isFixed,
                defaultValue: checked ? "" : col.defaultValue
              })
            }}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor={`headerOnly-${col.id}`} className="text-[11px] font-medium text-white/70 cursor-pointer">
            Solo Membrete (Sin valor)
          </label>
        </div>

        {!col.isHeaderOnly && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`fixed-${col.id}`}
                checked={col.isFixed ?? (col.type === "reference" || col.type === "unit")}
                onChange={(e) => onUpdate({ ...col, isFixed: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor={`fixed-${col.id}`} className="text-[11px] font-medium text-white/70 cursor-pointer">
                Valor Fijo (no editable)
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 block">Valor Fijo / Por Defecto:</label>
              <input
                type="text"
                value={col.defaultValue ?? ""}
                onChange={(e) => onUpdate({ ...col, defaultValue: e.target.value })}
                placeholder={
                  col.type === "reference" ? "Ej: 4.5 - 11.0" :
                    col.type === "unit" ? "Ej: mg/dL, %" :
                      "Valor predeterminado..."
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* ── NUEVA SECCIÓN: LIMITES NUMÉRICOS PARA BANDERAS CUSTOM ── */}
            {col.type === "reference" && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                <ReferenceValuesEditor
                  // Creamos un adaptador para transformar las propiedades de la columna al formato del Editor
                  value={{
                    type: col.refType || "two_point",
                    min: col.min,
                    max: col.max,
                    groups: col.groups
                  }}
                  // Al cambiar los valores en el editor, los esparcimos en las propiedades nativas de la columna
                  onChange={(newValue) => {
                    onUpdate({
                      ...col,
                      refType: newValue.type,
                      min: newValue.type !== "group" ? newValue.min : undefined,
                      max: newValue.type !== "group" ? newValue.max : undefined,
                      groups: newValue.type === "group" ? newValue.groups : undefined,
                      // Automáticamente actualizamos el texto por defecto que ve el paciente si no es de tipo grupo
                      defaultValue: newValue.type === "two_point"
                        ? `${newValue.min ?? 0} - ${newValue.max ?? 0}`
                        : newValue.type === "single_point"
                          ? `Hasta ${newValue.max ?? 0}`
                          : "Ver desglose por grupos" // Texto descriptivo si es hormonal/grupal
                    })
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
      {!col.isHeaderOnly && (
        <>
          <div className="mb-2 flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-2 py-1">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-medium">
              ID de Columna:
            </span>
            <div className="flex items-center gap-1.5">
              <code className="text-[10px] font-mono text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded select-all">
                {col.id}
              </code>
            </div>
          </div>
          {/* ── NUEVA SECCIÓN: INPUT PARA LA EXPRESIÓN DE LA FÓRMULA ── */}
          {col.type === "formula" && (
            <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
              <label className="text-[10px] text-cyan-400 block font-medium">
                Expresión Matemática de la Fórmula:
              </label>
              <input
                type="text"
                value={col.formulaExpression ?? ""}
                onChange={(e) => onUpdate({ ...col, formulaExpression: e.target.value })}
                placeholder="Ej: ({col_paciente} / {col_control})"
                className="w-full rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-xs text-cyan-200 placeholder-cyan-500/30 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <p className="text-[9px] text-white/40 leading-tight">
                Usa los IDs de las columnas entre llaves. Ej: <code className="text-white/60">{`{id_col}`}</code>. Operadores válidos: <code className="text-white/60">+ - * / ( )</code> para exponentes usar **
              </p>
            </div>
          )}
        </>
      )}

      {/* Dropdown options (only for select type) */}
      {col.type === "select" && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
          <button
            type="button"
            onClick={() => setShowOptions(v => !v)}
            className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-400"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {showOptions ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Opciones de la lista ({col.options?.length ?? 0})
          </button>
          {showOptions && (
            <DropdownOptionsEditor
              options={col.options ?? []}
              onChange={(opts) => onUpdate({ ...col, options: opts })}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Row Editor ───────────────────────────────────────────────────────────────
interface RowEditorProps {
  row: FormatRow
  rowIndex: number
  rowCount: number
  onUpdate: (row: FormatRow) => void
  onRemove: () => void
  onMove: (dir: "up" | "down") => void
  onCopyColumnsFromAbove?: () => void
}

function RowEditor({ row, rowIndex, rowCount, onUpdate, onRemove, onMove, onCopyColumnsFromAbove }: RowEditorProps) {
  const ROW_META: Record<string, { label: string; color: string }> = {
    empty: { label: "Fila Vacía", color: "border-white/20 text-white/40" },
    header: { label: "Membrete", color: "border-yellow-500/40 text-yellow-400" },
    test: { label: "Fila de Prueba", color: "border-primary-500/40 text-primary-400" },
    simple: { label: "Fila Simple", color: "border-emerald-500/40 text-emerald-400" },
  }
  const meta = ROW_META[row.type] || { label: row.type, color: "border-white/20 text-white/40" }

  const addColumn = () => {
    if (row.type !== "test" && row.type !== "simple") return
    const updated = { ...row, columns: [...row.columns, makeColumn()] }
    onUpdate(updated)
  }

  const updateColumn = (i: number, col: FormatColumn) => {
    if (row.type !== "test" && row.type !== "simple") return
    const cols = [...row.columns]
    cols[i] = col
    onUpdate({ ...row, columns: cols } as any)
  }

  const removeColumn = (i: number) => {
    if (row.type !== "test" && row.type !== "simple") return
    onUpdate({ ...row, columns: row.columns.filter((_, idx) => idx !== i) } as any)
  }

  const moveColumn = (i: number, dir: "left" | "right") => {
    if (row.type !== "test" && row.type !== "simple") return
    const cols = [...row.columns]
    const swap = dir === "left" ? i - 1 : i + 1
    if (swap < 0 || swap >= cols.length) return
      ;[cols[i], cols[swap]] = [cols[swap], cols[i]]
    onUpdate({ ...row, columns: cols } as any)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface-900 overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
          {meta.label}
        </span>
        <span className="text-xs text-white/30">#{rowIndex + 1}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onMove("up")}
          disabled={rowIndex === 0}
          className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-20"
          title="Subir fila"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove("down")}
          disabled={rowIndex === rowCount - 1}
          className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-20"
          title="Bajar fila"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-red-400/50 hover:bg-red-500/10 hover:text-red-400"
          title="Eliminar fila"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Row body */}
      <div className="px-4 py-3">
        {row.type === "empty" && (
          <div className="flex items-center gap-2 text-sm text-white/30 italic">
            <Minus className="h-4 w-4" />
            Separador visual (fila en blanco)
          </div>
        )}

        {row.type === "header" && (
          <input
            type="text"
            value={row.text}
            onChange={(e) => onUpdate({ ...row, text: e.target.value })}
            placeholder="Texto del membrete, ej: Análisis Macroscópico:"
            className="w-full rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        )}

        {(row.type === "test" || row.type === "simple") && (
          <div className="space-y-3">
            {row.columns.length === 0 ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/30 italic">
                  Esta fila no tiene columnas aún. Agrega columnas o copia la estructura.
                </p>
                {onCopyColumnsFromAbove && (
                  <button
                    type="button"
                    onClick={onCopyColumnsFromAbove}
                    className="text-xs font-semibold text-primary-400 hover:underline"
                  >
                    Copiar estructura anterior
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {row.columns.map((col, i) => (
                  <ColumnEditor
                    key={col.id}
                    col={col}
                    colIndex={i}
                    colCount={row.columns.length}
                    onUpdate={(c) => updateColumn(i, c)}
                    onRemove={() => removeColumn(i)}
                    onMove={(dir) => moveColumn(i, dir)}
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addColumn}
                className="flex items-center gap-1.5 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-400 hover:bg-primary-500/20 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Columna
              </button>
              {row.columns.length === 0 && onCopyColumnsFromAbove && (
                <button
                  type="button"
                  onClick={onCopyColumnsFromAbove}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/5 transition"
                >
                  Usar misma estructura de arriba
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main FormatBuilder ───────────────────────────────────────────────────────
export default function FormatBuilder({ value, onChange, formatName: _formatName }: FormatBuilderProps) {
  const [showPreview, setShowPreview] = useState(true)

  const { rows } = value

  const setRows = useCallback((newRows: FormatRow[]) => {
    onChange({ rows: newRows })
  }, [onChange])

  const addRow = (type: FormatRow["type"]) => {
    const newRow =
      type === "empty"
        ? makeEmpty()
        : type === "header"
          ? makeHeader()
          : type === "simple"
            ? makeSimple()
            : makeTest()
    setRows([...rows, newRow])
  }

  const updateRow = (i: number, row: FormatRow) => {
    const next = [...rows]
    next[i] = row
    setRows(next)
  }

  const removeRow = (i: number) => {
    setRows(rows.filter((_, idx) => idx !== i))
  }

  const moveRow = (i: number, dir: "up" | "down") => {
    const next = [...rows]
    const swap = dir === "up" ? i - 1 : i + 1
    if (swap < 0 || swap >= next.length) return
      ;[next[i], next[swap]] = [next[swap], next[i]]
    setRows(next)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-white/60">Agregar fila:</span>
        <button
          type="button"
          onClick={() => addRow("empty")}
          className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          <Minus className="h-3.5 w-3.5" />
          Vacía
        </button>
        <button
          type="button"
          onClick={() => addRow("header")}
          className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 transition"
        >
          <AlignLeft className="h-3.5 w-3.5" />
          Membrete
        </button>
        <button
          type="button"
          onClick={() => addRow("test")}
          className="flex items-center gap-1.5 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-400 hover:bg-primary-500/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Fila de Prueba (Cabecera)
        </button>
        <button
          type="button"
          onClick={() => addRow("simple")}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Fila Simple
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(v => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white transition"
        >
          {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPreview ? "Ocultar" : "Mostrar"} vista previa
        </button>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <div className="mb-3 text-4xl">📋</div>
          <p className="text-sm text-white/50">El formato está vacío.</p>
          <p className="text-xs text-white/30">Usa los botones de arriba para agregar filas.</p>
        </div>
      )}

      {/* Two-panel layout: editor + preview */}
      {rows.length > 0 && (
        <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Editor panel */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Estructura del Formato
            </h3>
            {rows.map((row, i) => (
              <RowEditor
                key={row.id}
                row={row}
                rowIndex={i}
                rowCount={rows.length}
                onUpdate={(r) => updateRow(i, r)}
                onRemove={() => removeRow(i)}
                onMove={(dir) => moveRow(i, dir)}
                onCopyColumnsFromAbove={
                  row.type === "simple" && i > 0
                    ? () => {
                      // Find the first preceding TestRow
                      for (let j = i - 1; j >= 0; j--) {
                        if (rows[j].type === "test" || rows[j].type === "simple") {
                          const prevRow = rows[j] as TestRow | SimpleRow
                          // Deep copy columns but generate new IDs
                          const newCols = prevRow.columns.map((c: FormatColumn) => ({
                            ...c,
                            id: crypto.randomUUID(),
                          }))
                          updateRow(i, { ...row, columns: newCols })
                          break
                        }
                      }
                    }
                    : undefined
                }
              />
            ))}
          </div>

          {/* Preview panel */}
          {showPreview && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Vista Previa
              </h3>
              <FormatPreview template={value} className="sticky top-4" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
