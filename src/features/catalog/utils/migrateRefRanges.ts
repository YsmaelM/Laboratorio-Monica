import type { RefRange, ReferenceValue } from "@/shared/types"

export function migrateRefRange(oldRange?: RefRange): ReferenceValue | undefined {
  if (!oldRange) return undefined
  
  // If it's already in the new format (has a type), return it
  if ((oldRange as any).type) {
    return oldRange as any as ReferenceValue
  }

  const groups: { name: string; type: "two_point"; min: number; max: number }[] = []
  
  if (oldRange.male) {
    groups.push({
      name: "Hombres",
      type: "two_point",
      min: oldRange.male.min ?? 0,
      max: oldRange.male.max ?? 0
    })
  }
  
  if (oldRange.female) {
    groups.push({
      name: "Mujeres",
      type: "two_point",
      min: oldRange.female.min ?? 0,
      max: oldRange.female.max ?? 0
    })
  }
  
  if (oldRange.child) {
    groups.push({
      name: "Niños",
      type: "two_point",
      min: oldRange.child.min ?? 0,
      max: oldRange.child.max ?? 0
    })
  }

  if (groups.length === 0) return undefined

  return {
    type: "group",
    groups
  }
}
