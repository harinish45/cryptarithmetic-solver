// ============================================================
// AC-3 — Arc Consistency Algorithm 3
// ============================================================

import { CSPVariable, PuzzleAST } from '@cryptarithmetic/shared';

/**
 * Applies Arc Consistency (AC-3) to reduce variable domains.
 *
 * Enforces:
 * 1. AllDifferent constraint: no two variables can share the same digit.
 * 2. Cryptarithmetic structural constraints (when puzzle is provided):
 *    - Carry bounds on leading letter of result
 *    - Column 0 modular arithmetic consistency (carry-in is 0)
 *
 * @param variables - Array of CSP variables with domains
 * @param puzzle - Optional parsed puzzle AST for domain tightening
 * @returns Reduced variables, or null if inconsistency is detected
 */
export function ac3(
    variables: CSPVariable[],
    puzzle?: PuzzleAST
): CSPVariable[] | null {
    // Deep copy domains so we don't mutate the original
    const vars: CSPVariable[] = variables.map((v) => ({
        ...v,
        domain: [...v.domain],
    }));

    // Apply structural puzzle constraints if available
    if (puzzle) {
        if (!applyStructuralConstraints(vars, puzzle)) {
            return null;
        }
    }

    // Build a queue of arcs (pairs of variables) for AllDifferent
    const queue: [number, number][] = [];
    for (let i = 0; i < vars.length; i++) {
        for (let j = 0; j < vars.length; j++) {
            if (i !== j) {
                queue.push([i, j]);
            }
        }
    }

    while (queue.length > 0) {
        const [xi, xj] = queue.shift()!;

        if (revise(vars, xi, xj)) {
            if (vars[xi].domain.length === 0) {
                return null; // Inconsistency — no valid assignment possible
            }

            // Re-add all arcs (xk, xi) where xk != xj
            for (let k = 0; k < vars.length; k++) {
                if (k !== xi && k !== xj) {
                    queue.push([k, xi]);
                }
            }
        }
    }

    // Pair propagation for AllDifferent
    applyPairConsistency(vars);

    // Verify all domains are non-empty
    for (const v of vars) {
        if (v.domain.length === 0) return null;
    }

    return vars;
}

/**
 * Applies initial structural arithmetic constraints to variable domains.
 */
function applyStructuralConstraints(
    vars: CSPVariable[],
    puzzle: PuzzleAST
): boolean {
    if (puzzle.operator !== '+') return true;

    const maxOpLen = Math.max(...puzzle.operands.map((o) => o.length));
    const resultLen = puzzle.result.length;

    // In addition, result can never be more than maxOpLen + 1 digits
    if (resultLen > maxOpLen + 1 || resultLen < maxOpLen) {
        if (resultLen > maxOpLen + 1) return false;
    }

    // If result has an extra digit, its leading digit is the carry-out of max operand column
    if (resultLen > maxOpLen) {
        const leadingResultChar = puzzle.result[0];
        const resVar = vars.find((v) => v.letter === leadingResultChar);
        if (resVar) {
            const maxCarry = puzzle.operands.length - 1;
            resVar.domain = resVar.domain.filter(
                (d) => d >= 1 && d <= Math.max(1, maxCarry)
            );
            if (resVar.domain.length === 0) return false;
        }
    }

    // Column 0 arc consistency: sum of units digits mod 10 = result units digit
    pruneColumnZero(vars, puzzle);

    return true;
}

/**
 * Prunes Column 0 (units place) domains using modular arithmetic.
 */
function pruneColumnZero(vars: CSPVariable[], puzzle: PuzzleAST): void {
    const resLetter = puzzle.result[puzzle.result.length - 1];
    const opLetters = puzzle.operands.map((op) => op[op.length - 1]);
    const colLetters = [...new Set([...opLetters, resLetter])];

    const varMap = new Map<string, CSPVariable>();
    for (const v of vars) {
        varMap.set(v.letter, v);
    }

    // Filter values for each letter in column 0
    for (const letter of colLetters) {
        const currentVar = varMap.get(letter);
        if (!currentVar) continue;

        const validValues = currentVar.domain.filter((candidateVal) => {
            return checkColZeroSupport(
                letter,
                candidateVal,
                opLetters,
                resLetter,
                varMap
            );
        });

        currentVar.domain = validValues;
    }
}

/**
 * Checks if a candidate value for a column 0 variable has supporting values
 * for other column 0 variables such that sum(operands) % 10 === result.
 */
function checkColZeroSupport(
    targetLetter: string,
    candidateVal: number,
    opLetters: string[],
    resLetter: string,
    varMap: Map<string, CSPVariable>
): boolean {
    const letters = [...new Set([...opLetters, resLetter])];
    const assigned: Record<string, number> = { [targetLetter]: candidateVal };
    const usedDigits = new Set<number>([candidateVal]);

    function search(index: number): boolean {
        if (index === letters.length) {
            let sum = 0;
            for (const op of opLetters) {
                sum += assigned[op];
            }
            return sum % 10 === assigned[resLetter];
        }

        const l = letters[index];
        if (l in assigned) {
            return search(index + 1);
        }

        const domain = varMap.get(l)?.domain || [];
        for (const d of domain) {
            if (!usedDigits.has(d)) {
                usedDigits.add(d);
                assigned[l] = d;
                if (search(index + 1)) return true;
                delete assigned[l];
                usedDigits.delete(d);
            }
        }

        return false;
    }

    return search(0);
}

/**
 * Revises the domain of variable xi with respect to variable xj.
 * For AllDifferent: removes any value from xi's domain that has
 * no consistent pairing in xj's domain.
 */
function revise(
    vars: CSPVariable[],
    xi: number,
    xj: number
): boolean {
    let revised = false;

    // For AllDifferent constraint: if xj has a singleton domain {v},
    // remove v from xi's domain
    if (vars[xj].domain.length === 1) {
        const forcedValue = vars[xj].domain[0];
        const idx = vars[xi].domain.indexOf(forcedValue);
        if (idx !== -1) {
            vars[xi].domain.splice(idx, 1);
            revised = true;
        }
    }

    return revised;
}

/**
 * If two variables have the exact same 2-value domain, those values
 * cannot be taken by any other variable (naked pairs).
 */
function applyPairConsistency(vars: CSPVariable[]): void {
    for (let i = 0; i < vars.length; i++) {
        if (vars[i].domain.length === 2) {
            for (let j = i + 1; j < vars.length; j++) {
                if (
                    vars[j].domain.length === 2 &&
                    vars[i].domain[0] === vars[j].domain[0] &&
                    vars[i].domain[1] === vars[j].domain[1]
                ) {
                    const [v1, v2] = vars[i].domain;
                    for (let k = 0; k < vars.length; k++) {
                        if (k !== i && k !== j) {
                            vars[k].domain = vars[k].domain.filter(
                                (d) => d !== v1 && d !== v2
                            );
                        }
                    }
                }
            }
        }
    }
}

/**
 * Forward checking: after assigning a value to a variable,
 * remove that value from all other variables' domains.
 *
 * @returns Updated variables, or null if any domain becomes empty
 */
export function forwardCheck(
    variables: CSPVariable[],
    assignedIndex: number,
    assignedValue: number
): CSPVariable[] | null {
    const vars: CSPVariable[] = variables.map((v, i) => {
        if (i === assignedIndex) {
            return { ...v, domain: [assignedValue] };
        }
        const newDomain = v.domain.filter((d) => d !== assignedValue);
        return { ...v, domain: newDomain };
    });

    // Check for empty domains
    for (let i = 0; i < vars.length; i++) {
        if (i !== assignedIndex && vars[i].domain.length === 0) {
            return null;
        }
    }

    return vars;
}
