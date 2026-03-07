// ============================================================
// AlgorithmSelector — Dropdown for solver algorithm
// ============================================================

import React from 'react';
import type { SolverAlgorithm } from '@cryptarithmetic/shared';

interface AlgorithmSelectorProps {
    algorithm: SolverAlgorithm;
    onChange: (algo: SolverAlgorithm) => void;
}

const options: { value: SolverAlgorithm; label: string }[] = [
    { value: 'hybrid', label: 'Hybrid (AC-3 + Backtracking)' },
    { value: 'backtracking', label: 'Backtracking (MRV/LCV)' },
    { value: 'ac3', label: 'AC-3 + Backtracking' },
    { value: 'brute-force', label: 'Brute Force (small puzzles)' },
];

export function AlgorithmSelector({ algorithm, onChange }: AlgorithmSelectorProps) {
    return (
        <select
            id="algorithm-select"
            className="algo-select"
            value={algorithm}
            onChange={(e) => onChange(e.target.value as SolverAlgorithm)}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
