// ============================================================
// App — Root Component (Three-Panel Layout)
// ============================================================

/// <reference types="vite/client" />
import React, { useState, useCallback } from 'react';
import type { SolverResult, SolverAlgorithm, LibraryPuzzle } from '@cryptarithmetic/shared';
import { PuzzleLibrary } from './components/PuzzleLibrary';
import { PuzzleEditor } from './components/PuzzleEditor';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { SolutionDisplay } from './components/SolutionDisplay';
import { PerformanceStats } from './components/PerformanceStats';
import { ExportButton } from './components/ExportButton';
import { AgentChat } from './components/AgentChat';
import { solvePuzzle as solvePuzzleDirect } from '@cryptarithmetic/solver-core';

export function App() {
    const [expression, setExpression] = useState('SEND + MORE = MONEY');
    const [algorithm, setAlgorithm] = useState<SolverAlgorithm>('hybrid');
    const [maxSolutions, setMaxSolutions] = useState(10);
    const [result, setResult] = useState<SolverResult | null>(null);
    const [solving, setSolving] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleSolve = useCallback(async () => {
        if (!expression.trim() || solving) return;
        setSolving(true);
        setResult(null);

        try {
            // Try IPC (Electron) first, fall back to direct for dev/web
            if (window.solverAPI) {
                const res = await window.solverAPI.solvePuzzle({
                    expression: expression.trim(),
                    algorithm,
                    maxSolutions,
                });
                setResult(res);
            } else {
                // Direct call (Vite dev server) or API call (Vercel production web mode)
                if (import.meta.env.PROD) {
                    const response = await fetch('/api/solve', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            expression: expression.trim(),
                            algorithm,
                            maxSolutions
                        })
                    });
                    const res = await response.json();
                    setResult(res);
                } else {
                    const res = solvePuzzleDirect(expression.trim(), algorithm, maxSolutions);
                    setResult(res);
                }
            }
        } catch (err) {
            setResult({
                success: false,
                solutions: [],
                stats: {
                    algorithm,
                    solveTimeMs: 0,
                    nodesExplored: 0,
                    backtracks: 0,
                    solutionsFound: 0,
                },
                error: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setSolving(false);
        }
    }, [expression, algorithm, maxSolutions, solving]);

    const handleSelectPuzzle = useCallback((puzzle: LibraryPuzzle) => {
        setExpression(puzzle.expression);
        setResult(null);
    }, []);

    return (
        <div className="app">
            {/* Header */}
            <header className="app-header">
                <div>
                    <h1>⊕ Cryptarithmetic Solver</h1>
                    <span className="made-by" style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '1rem' }}>Made by Harinish</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setIsChatOpen(true)}
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✨ Ask AI
                    </button>
                    <span className="header-badge">v1.0.0</span>
                </div>
            </header>

            {isChatOpen && <AgentChat onClose={() => setIsChatOpen(false)} />}

            {/* Left: Puzzle Library */}
            <PuzzleLibrary
                selectedExpression={expression}
                onSelectPuzzle={handleSelectPuzzle}
            />

            {/* Center: Editor */}
            <main className="main-panel">
                <div className="editor-area">
                    <PuzzleEditor
                        expression={expression}
                        onChange={setExpression}
                        onSolve={handleSolve}
                    />

                    <div className="controls">
                        <AlgorithmSelector
                            algorithm={algorithm}
                            onChange={setAlgorithm}
                        />
                        <button
                            id="solve-button"
                            className={`solve-btn ${solving ? 'solving' : ''}`}
                            onClick={handleSolve}
                            disabled={solving || !expression.trim()}
                        >
                            {solving ? (
                                <>
                                    <span className="spinner" />
                                    Solving…
                                </>
                            ) : (
                                '▶ Solve'
                            )}
                        </button>
                    </div>
                </div>
            </main>

            {/* Right: Results */}
            <aside className="results-panel">
                <div className="results-header">
                    <h2>Results</h2>
                    {result && result.success && (
                        <ExportButton result={result} expression={expression} />
                    )}
                </div>

                <div className="results-body">
                    <SolutionDisplay result={result} solving={solving} />
                </div>

                {result && result.stats.solveTimeMs > 0 && (
                    <PerformanceStats stats={result.stats} />
                )}
            </aside>
        </div>
    );
}
