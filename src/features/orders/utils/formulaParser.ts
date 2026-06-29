/**
 * Safely parses and evaluates mathematical formulas based on custom row inputs.
 */
export function evaluateFormula(
    formulaExpression: string | undefined,
    rowId: string,
    data: Record<string, string | number>
): string {
    if (!formulaExpression) return "—";

    try {
        let expression = formulaExpression;

        // 1. Find all variables inside brackets: {col_id}
        const tokenRegex = /\{([^}]+)\}/g;
        let match;
        let missingField = false;

        while ((match = tokenRegex.exec(formulaExpression)) !== null) {
            const targetColId = match[1];
            const fieldKey = `${rowId}_${targetColId}`;
            const rawValue = data[fieldKey];

            // Convert value to a pure floating-point number
            const numValue = Number(rawValue);

            if (rawValue === undefined || rawValue === "" || isNaN(numValue)) {
                missingField = true; // Wait until the operator fills all fields
                break;
            }

            // Replace the token with the verified number
            expression = expression.replace(`{${targetColId}}`, numValue.toString());
        }

        if (missingField) return "—"; // Return placeholder if dependent variables are empty

        // 2. Sanitize expression strictly to avoid malicious code injections (XSS Security)
        const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, "");

        // 3. Execute math evaluation safely
        // Function evaluates the string math safely without standard risks of eval()
        const result = new Function(`return (${sanitizedExpression})`)();

        if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
            return "0";
        }

        // Return formatting based on whether it needs decimals (like Razón PT 1.25)
        return Number(result) % 1 === 0 ? result.toString() : Number(result).toFixed(2);

    } catch (error) {
        console.error("Formula parsing error:", error);
        return "Error";
    }
}
