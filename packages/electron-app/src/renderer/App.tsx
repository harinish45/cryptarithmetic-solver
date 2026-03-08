// ============================================================
// App — Root Component (Three-Panel Layout)
// ============================================================

/// <reference types="vite/client" />
import React, { useState, useCallback, useEffect } from 'react';
import type { SolverResult, SolverAlgorithm, LibraryPuzzle } from '@cryptarithmetic/shared';
import { PuzzleLibrary } from './components/PuzzleLibrary';
import { PuzzleEditor } from './components/PuzzleEditor';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { SolutionDisplay } from './components/SolutionDisplay';
import { PerformanceStats } from './components/PerformanceStats';
import { ExportButton } from './components/ExportButton';
import { AgentChat } from './components/AgentChat';
import { solvePuzzle as solvePuzzleDirect } from '@cryptarithmetic/solver-core';
import puzzlesData from '../data/puzzle-library.json';

interface HistoryItem {
    expression: string;
    timestamp: number;
    success: boolean;
}

interface AppStats {
    totalSolved: number;
    totalTimeMs: number;
    puzzlesAttempted: number;
}

export function App() {
    const [expression, setExpression] = useState('SEND + MORE = MONEY');
    const [algorithm, setAlgorithm] = useState<SolverAlgorithm>('hybrid');
    const [maxSolutions, setMaxSolutions] = useState(10);
    const [result, setResult] = useState<SolverResult | null>(null);
    const [solving, setSolving] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [appStats, setAppStats] = useState<AppStats>({
        totalSolved: 0,
        totalTimeMs: 0,
        puzzlesAttempted: 0,
    });
    const [copied, setCopied] = useState(false);
    const [hintMsg, setHintMsg] = useState<string | null>(null);

    // Load history and stats from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('cryptarithmetic-history');
        const savedStats = localStorage.getItem('cryptarithmetic-stats');
        const savedTheme = localStorage.getItem('cryptarithmetic-theme');

        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }

        if (savedStats) {
            try {
                setAppStats(JSON.parse(savedStats));
            } catch (e) {
                console.error('Failed to parse stats', e);
            }
        }

        if (savedTheme) {
            setTheme(savedTheme as 'dark' | 'light');
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    // Save history to localStorage
    useEffect(() => {
        localStorage.setItem('cryptarithmetic-history', JSON.stringify(history.slice(0, 50)));
    }, [history]);

    // Save stats to localStorage
    useEffect(() => {
        localStorage.setItem('cryptarithmetic-stats', JSON.stringify(appStats));
    }, [appStats]);

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cryptarithmetic-theme', theme);
    }, [theme]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!solving && expression.trim()) {
                    handleSolve();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [solving, expression]);

    // Check for shared puzzle in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sharedExpr = params.get('puzzle');
        if (sharedExpr) {
            setExpression(decodeURIComponent(sharedExpr));
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

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

                // Update stats
                setAppStats(prev => ({
                    totalSolved: prev.totalSolved + (res.success ? 1 : 0),
                    totalTimeMs: prev.totalTimeMs + res.stats.solveTimeMs,
                    puzzlesAttempted: prev.puzzlesAttempted + 1,
                }));

                // Add to history
                setHistory(prev => [{
                    expression: expression.trim(),
                    timestamp: Date.now(),
                    success: res.success,
                }, ...prev.slice(0, 49)]);
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

                    // Update stats
                    setAppStats(prev => ({
                        totalSolved: prev.totalSolved + (res.success ? 1 : 0),
                        totalTimeMs: prev.totalTimeMs + res.stats.solveTimeMs,
                        puzzlesAttempted: prev.puzzlesAttempted + 1,
                    }));

                    // Add to history
                    setHistory(prev => [{
                        expression: expression.trim(),
                        timestamp: Date.now(),
                        success: res.success,
                    }, ...prev.slice(0, 49)]);
                } else {
                    const res = solvePuzzleDirect(expression.trim(), algorithm, maxSolutions);
                    setResult(res);

                    // Update stats
                    setAppStats(prev => ({
                        totalSolved: prev.totalSolved + (res.success ? 1 : 0),
                        totalTimeMs: prev.totalTimeMs + res.stats.solveTimeMs,
                        puzzlesAttempted: prev.puzzlesAttempted + 1,
                    }));

                    // Add to history
                    setHistory(prev => [{
                        expression: expression.trim(),
                        timestamp: Date.now(),
                        success: res.success,
                    }, ...prev.slice(0, 49)]);
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

            // Add failed attempt to history
            setHistory(prev => [{
                expression: expression.trim(),
                timestamp: Date.now(),
                success: false,
            }, ...prev.slice(0, 49)]);
        } finally {
            setSolving(false);
        }
    }, [expression, algorithm, maxSolutions, solving]);

    const handleSelectPuzzle = useCallback((puzzle: LibraryPuzzle) => {
        setExpression(puzzle.expression);
        setResult(null);
    }, []);

    const handleThemeToggle = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const handleClearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const handleHistorySelect = useCallback((item: HistoryItem) => {
        setExpression(item.expression);
        setResult(null);
    }, []);

    const handleShare = useCallback(async () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?puzzle=${encodeURIComponent(expression)}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Cryptarithmetic Puzzle',
                    text: `Check out this puzzle: ${expression}`,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or error
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    }, [expression]);

    const handleGeneratePuzzle = useCallback(() => {
        const randomIdx = Math.floor(Math.random() * puzzlesData.length);
        setExpression(puzzlesData[randomIdx].expression);
        setResult(null);
        setHintMsg(null);
    }, []);

    const handleGetHint = useCallback(async () => {
        if (!expression.trim() || solving) return;

        setHintMsg("Thinking...");
        try {
            let res;
            if (window.solverAPI) {
                res = await window.solverAPI.solvePuzzle({
                    expression: expression.trim(),
                    algorithm: 'hybrid',
                    maxSolutions: 1,
                });
            } else if (import.meta.env.PROD) {
                const response = await fetch('/api/solve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        expression: expression.trim(),
                        algorithm: 'hybrid',
                        maxSolutions: 1
                    })
                });
                res = await response.json();
            } else {
                res = solvePuzzleDirect(expression.trim(), 'hybrid', 1);
            }

            if (res.success && res.solutions.length > 0) {
                const sol = res.solutions[0];
                const keys = Object.keys(sol);
                if (keys.length > 0) {
                    const randomKey = keys[Math.floor(Math.random() * keys.length)];
                    setHintMsg(`💡 Hint: ${randomKey} = ${sol[randomKey]}`);
                } else {
                    setHintMsg("No hint available.");
                }
            } else {
                setHintMsg("No valid solution found.");
            }
        } catch (err) {
            setHintMsg("Error generating hint.");
        }

        setTimeout(() => setHintMsg(null), 4000);
    }, [expression, solving]);

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
                        className="theme-toggle"
                        onClick={handleThemeToggle}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button
                        onClick={() => setIsChatOpen(true)}
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✨ Ask AI
                    </button>
                    <span className="header-badge">v1.1.0</span>
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
                            className="secondary-btn"
                            onClick={handleGeneratePuzzle}
                            title="Generate random puzzle"
                            disabled={solving}
                        >
                            🎲 Random
                        </button>
                        <button
                            className="secondary-btn"
                            onClick={handleGetHint}
                            title="Get a hint"
                            disabled={!expression.trim() || solving}
                        >
                            💡 Hint
                        </button>
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

                    <div className="shortcuts-hint" style={{ minHeight: '20px' }}>
                        {hintMsg ? (
                            <span style={{ color: 'var(--accent-bright)', fontWeight: 500 }}>{hintMsg}</span>
                        ) : (
                            <>Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to solve</>
                        )}
                    </div>
                </div>
            </main>

            {/* Right: Results */}
            <aside className="results-panel">
                <div className="results-header">
                    <h2>Results</h2>
                    <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                            className="share-btn"
                            onClick={handleShare}
                            title="Share this puzzle"
                        >
                            {copied ? '✓ Copied!' : '🔗 Share'}
                        </button>
                        {result && result.success && (
                            <ExportButton result={result} expression={expression} />
                        )}
                    </div>
                </div>

                <div className="results-body">
                    <SolutionDisplay result={result} solving={solving} />
                </div>

                {result && result.stats.solveTimeMs > 0 && (
                    <PerformanceStats stats={result.stats} />
                )}

                {/* Statistics Dashboard */}
                <div className="stats-dashboard">
                    <h3>📊 Your Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{appStats.puzzlesAttempted}</div>
                            <div className="stat-label">Attempted</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{appStats.totalSolved}</div>
                            <div className="stat-label">Solved</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{appStats.totalTimeMs > 0 ? (appStats.totalTimeMs / 1000).toFixed(2) : '0'}</div>
                            <div className="stat-label">Total Time (s)</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{appStats.puzzlesAttempted > 0 ? Math.min(100, Math.round(appStats.totalSolved / appStats.puzzlesAttempted * 100)) : 0}%</div>
                            <div className="stat-label">Success Rate</div>
                        </div>
                    </div>
                </div>

                {/* History Panel */}
                <div className="history-panel">
                    <div className="history-header">
                        <h3>🕐 Recent</h3>
                        {history.length > 0 && (
                            <button className="history-clear" onClick={handleClearHistory}>
                                Clear
                            </button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px' }}>
                            No history yet
                        </div>
                    ) : (
                        history.slice(0, 10).map((item, idx) => (
                            <div
                                key={idx}
                                className="history-item"
                                onClick={() => handleHistorySelect(item)}
                            >
                                <div className="history-item-expr" style={{ color: item.success ? 'var(--success)' : 'var(--error)' }}>
                                    {item.expression}
                                </div>
                                <div className="history-item-time">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>
        </div>
    );
}
