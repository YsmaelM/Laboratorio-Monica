const evaluateFormula = (
    formulaExpression: string | undefined,
    rowId: string,
    data: Record<string, string | number>
): string => {
    if (!formulaExpression) return "—"

    try {
        let expression = formulaExpression

        // 1. Reemplazar las variables {id} por sus números reales
        const tokenRegex = /\{([^}]+)\}/g
        let match
        let missingField = false
        const replacements: Array<{ token: string; value: string }> = []

        while ((match = tokenRegex.exec(formulaExpression)) !== null) {
            const targetColId = match[1]
            const fieldKey = `${rowId}_${targetColId}`
            const rawValue = data[fieldKey]
            const numValue = Number(rawValue)

            if (rawValue === undefined || rawValue === "" || isNaN(numValue)) {
                missingField = true
                break
            }

            replacements.push({ token: match[0], value: numValue.toString() })
        }

        if (missingField) return "—"

        replacements.forEach(({ token, value }) => {
            expression = expression.split(token).join(value)
        })

        if (expression.includes("{") || expression.includes("}")) {
            return "—"
        }

        // ── 2. FILTRO DE SANITIZACIÓN ACTUALIZADO ──
        // El mapa de caracteres permitidos sigue aceptando números, operadores básicos y el asterisco (*)
        const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, "")

        if (!sanitizedExpression.trim()) return "—"

        // 3. Ejecución directa (JavaScript procesará los '**' de forma nativa)
        const result = new Function(`return (${sanitizedExpression})`)()

        if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
            return "0"
        }

        return Number(result) % 1 === 0 ? result.toString() : Number(result).toFixed(2)
    } catch (error) {
        console.error("Formula parsing error with native power:", error)
        return "Error"
    }
}
