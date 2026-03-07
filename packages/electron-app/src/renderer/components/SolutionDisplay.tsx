// ============================================================
// SolutionDisplay — Color-coded mapping and substituted puzzle
// ============================================================

import React, { useState } from 'react';
import type { SolverResult } from '@cryptarithmetic/shared';

interface SolutionDisplayProps {
    result: SolverResult | null;
    solving: boolean;
}

export function SolutionDisplay({ result, solving }: SolutionDisplayProps) {
    const [page, setPage] = useState(0);

    // Reset page when result changes
    React.useEffect(() => setPage(0), [result]);

    if (solving) {
        return (
            <div className="empty-state">
                <span className="spinner" />
                <div className="empty-title">Solving…</div>
                <div className="empty-desc">Searching for valid digit assignments</div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🧩</div>
                <div className="empty-title">No results yet</div>
                <div className="empty-desc">Enter a puzzle and click Solve to find solutions</div>
            </div>
        );
    }

    if (result.error) {
        return (
            <div className="no-solution-banner">
                <h3>Error</h3>
                <p>{result.error}</p>
            </div>
        );
    }

    if (!result.success || result.solutions.length === 0) {
        return (
            <div className="no-solution-banner">
                <h3>No Solution Found</h3>
                <p>This puzzle has no valid digit assignment that satisfies all constraints.</p>
            </div>
        );
    }

    const solution = result.solutions[page];
    const totalPages = result.solutions.length;

    // Sort mapping alphabetically
    const mappingEntries = Object.entries(solution.mapping).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    return (
        <div>
            <div className="solution-card">
                <div className="solution-number">
                    Solution {page + 1} of {totalPages}
                </div>

                <div className="substituted-puzzle">{solution.substituted}</div>

                <div className="mapping-grid">
                    {mappingEntries.map(([letter, digit]) => (
                        <div key={letter} className="mapping-item">
                            <span className="mapping-letter">{letter}</span>
                            <span className="mapping-arrow">↓</span>
                            <span className="mapping-digit">{digit}</span>
                        </div>
                    ))}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                    >
                        ← Prev
                    </button>
                    <span className="page-info">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        className="page-btn"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
