// ============================================================
// AC-3 — Arc Consistency Algorithm 3
// ============================================================

import { CSPVariable } from '@cryptarithmetic/shared';

/**
 * Applies Arc Consistency (AC-3) to reduce variable domains.
 *
 * For cryptarithmetic, the key constraint is that all variables must
 * have distinct values (AllDifferent). AC-3 enforces this by removing
 * values from domains that cannot be part of any consistent assignment.
 *
 * @param variables - Array of CSP variables with domains
 * @returns Reduced variables, or null if inconsistency is detected
 */
export function ac3(variables: CSPVariable[]): CSPVariable[] | null {
    // Deep copy domains so we don't mutate the original
    const vars = variables.map((v) => ({
        ...v,
        domain: [...v.domain],
    }));

    // Build a queue of arcs (pairs of variables)
    const queue: [number, number][] = [];
    for (let i = 0; i < vars.length; i++) {
        for (let j = i + 1; j < vars.length; j++) {
            queue.push([i, j]);
            queue.push([j, i]);
        }
    }

    while (queue.length > 0) {
        const [xi, xj] = queue.shift()!;

        if (revise(vars, xi, xj)) {
            if (vars[xi].domain.length === 0) {
                return null; // Inconsistency — no valid assignment possible
            }

            // Add all arcs (xk, xi) where xk != xj
            for (let k = 0; k < vars.length; k++) {
                if (k !== xi && k !== xj) {
                    queue.push([k, xi]);
                }
            }
        }
    }

    return vars;
}

/**
 * Revises the domain of variable xi with respect to variable xj.
 * For AllDifferent: removes any value from xi's domain that has
 * no consistent pairing in xj's domain.
 *
 * A value `a` in xi's domain is removed if xj's domain is {a} — meaning
 * xj *must* take that value, so xi cannot.
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
    const vars = variables.map((v, i) => {
        if (i === assignedIndex) {
            return { ...v, domain: [assignedValue] };
        }
        const newDomain = v.domain.filter((d) => d !== assignedValue);
        return { ...v, domain: newDomain };
    });

    // Check for empty domains (excluding already assigned variables)
    for (let i = 0; i < vars.length; i++) {
        if (i !== assignedIndex && vars[i].domain.length === 0) {
            return null;
        }
    }

    return vars;
}
