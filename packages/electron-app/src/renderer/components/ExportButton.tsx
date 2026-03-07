// ============================================================
// ExportButton — JSON and CSV export
// ============================================================

import React, { useCallback } from 'react';
import type { SolverResult } from '@cryptarithmetic/shared';

interface ExportButtonProps {
    result: SolverResult;
    expression: string;
}

function toCSV(result: SolverResult, expression: string): string {
    const headers = ['Solution #', 'Substituted', ...Object.keys(result.solutions[0]?.mapping || {}).sort()];
    const rows = result.solutions.map((sol, i) => {
        const sorted = Object.entries(sol.mapping).sort(([a], [b]) => a.localeCompare(b));
        return [i + 1, `"${sol.substituted}"`, ...sorted.map(([, v]) => v)].join(',');
    });
    return [
        `# Puzzle: ${expression}`,
        `# Algorithm: ${result.stats.algorithm}`,
        `# Solve time: ${result.stats.solveTimeMs.toFixed(1)}ms`,
        '',
        headers.join(','),
        ...rows,
    ].join('\n');
}

function toJSON(result: SolverResult, expression: string): string {
    return JSON.stringify(
        {
            puzzle: expression,
            algorithm: result.stats.algorithm,
            stats: result.stats,
            solutions: result.solutions,
        },
        null,
        2
    );
}

export function ExportButton({ result, expression }: ExportButtonProps) {
    const handleExport = useCallback(
        async (format: 'json' | 'csv') => {
            const data = format === 'json' ? toJSON(result, expression) : toCSV(result, expression);
            const filename = `cryptarithmetic-${expression.replace(/[^A-Z]/gi, '_').toLowerCase()}.${format}`;

            if (window.solverAPI) {
                await window.solverAPI.exportSolution({ data, format, filename });
            } else {
                // Web fallback: download via blob
                const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            }
        },
        [result, expression]
    );

    return (
        <div className="export-group">
            <button className="export-btn" onClick={() => handleExport('json')}>
                Export JSON
            </button>
            <button className="export-btn" onClick={() => handleExport('csv')}>
                Export CSV
            </button>
        </div>
    );
}
