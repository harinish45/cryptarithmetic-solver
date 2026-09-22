// ============================================================
// App — Root Component (Premium Three-Panel Layout)
// ============================================================

/// <reference types="vite/client" />
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { SolverResult, SolverAlgorithm, LibraryPuzzle } from '@cryptarithmetic/shared';
import { PuzzleLibrary } from './components/PuzzleLibrary';
import { PuzzleEditor } from './components/PuzzleEditor';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { SolutionDisplay } from './components/SolutionDisplay';
import { PerformanceStats } from './components/PerformanceStats';
import { ExportButton } from './components/ExportButton';
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
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [appStats, setAppStats] = useState<AppStats>({
        totalSolved: 0,
        totalTimeMs: 0,
        puzzlesAttempted: 0,
    });
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

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
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleSolve = useCallback(async () => {
        if (!expression.trim() || solving) return;
        setSolving(true);
        setResult(null);
        setError(null);

        try {
            // Try IPC (Electron) first, fall back to direct for dev/web
            if (window.solverAPI) {
                const res = await window.solverAPI.solvePuzzle({
                    expression: expression.trim(),
                    algorithm,
                    maxSolutions,
                });
                setResult(res);
                if (!res.success) {
                    setError(res.error || 'No solution found for this puzzle.');
                }

                setAppStats(prev => ({
                    totalSolved: prev.totalSolved + (res.success ? 1 : 0),
                    totalTimeMs: prev.totalTimeMs + res.stats.solveTimeMs,
                    puzzlesAttempted: prev.puzzlesAttempted + 1,
                }));

                setHistory(prev => [{
                    expression: expression.trim(),
                    timestamp: Date.now(),
                    success: res.success,
                }, ...prev.slice(0, 49)]);
            } else {
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
                    if (!res.success) {
                        setError(res.error || 'No solution found for this puzzle.');
                    }

                    setAppStats(prev => ({
                        totalSolved: prev.totalSolved + (res.success ? 1 : 0),
                        totalTimeMs: prev.totalTimeMs + res.stats.solveTimeMs,
                        puzzlesAttempted: prev.puzzlesAttempted + 1,
                    }));

                    setHistory(prev => [{
                        expression: expression.trim(),
                        timestamp: Date.now(),
                        success: res.success,
                    }, ...prev.slice(0, 49)]);
                } else {
                    const res = solvePuzzleDirect(expression.trim(), algorithm, maxSolutions);
                    setResult(res);
                    if (!res.success) {
                        setError(res.error || 'No solution found for this puzzle.');
                    }

                    setAppStats(prev => ({
                        totalSolved: prev.totalSolved + (res.success ? 1 : 0),
                        totalTimeMs: prev.totalTimeMs + res.stats.solveTimeMs,
                        puzzlesAttempted: prev.puzzlesAttempted + 1,
                    }));

                    setHistory(prev => [{
                        expression: expression.trim(),
                        timestamp: Date.now(),
                        success: res.success,
                    }, ...prev.slice(0, 49)]);
                }
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setError(`An unexpected error occurred: ${errorMsg}`);
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
                error: errorMsg,
            });

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
        setError(null);
        inputRef.current?.focus();
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
        setError(null);
        inputRef.current?.focus();
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
                console.log('Share cancelled');
            }
        } else {
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
        setError(null);
        inputRef.current?.focus();
    }, []);

    const handleClear = useCallback(() => {
        setExpression('');
        setResult(null);
        setError(null);
        inputRef.current?.focus();
    }, []);

    return (
        <div className="app-container">
            {/* Animated Background Elements */}
            <div className="bg-gradient-orb orb-1"></div>
            <div className="bg-gradient-orb orb-2"></div>
            <div className="bg-gradient-orb orb-3"></div>

            {/* Header */}
            <header className="app-header">
                <div className="header-left">
                    <div className="logo-icon">⊕</div>
                    <div className="header-title-group">
                        <h1>Cryptarithmetic Solver</h1>
                        <span className="made-by">Crafted by Harinish</span>
                    </div>
                </div>
                <div className="header-right">
                    <button
                        className="theme-toggle-btn"
                        onClick={handleThemeToggle}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        )}
                    </button>
                    <span className="version-badge">v2.0.0</span>
                </div>
            </header>

            <div className="app-layout">
                {/* Left: Puzzle Library */}
                <aside className="sidebar-panel">
                    <PuzzleLibrary
                        selectedExpression={expression}
                        onSelectPuzzle={handleSelectPuzzle}
                    />
                </aside>

                {/* Center: Editor */}
                <main className="main-panel">
                    <div className="editor-card">
                        <div className="editor-header">
                            <h2>Puzzle Input</h2>
                            <span className="editor-hint">Use letters A-Z, +, -, *, /, =</span>
                        </div>
                        
                        <PuzzleEditor
                            expression={expression}
                            onChange={setExpression}
                            onSolve={handleSolve}
                            inputRef={inputRef}
                        />

                        {error && (
                            <div className="error-banner">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="controls-row">
                            <AlgorithmSelector
                                algorithm={algorithm}
                                onChange={setAlgorithm}
                            />
                            <div className="action-buttons">
                                <button
                                    className="icon-btn"
                                    onClick={handleGeneratePuzzle}
                                    title="Generate random puzzle"
                                    disabled={solving}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/></svg>
                                    Random
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={handleClear}
                                    title="Clear input"
                                    disabled={solving || !expression.trim()}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    Clear
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
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                            Solve
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="shortcuts-hint">
                            <span>Press</span>
                            <kbd>Ctrl</kbd>
                            <span>+</span>
                            <kbd>Enter</kbd>
                            <span>to solve instantly</span>
                        </div>
                    </div>
                </main>

                {/* Right: Results */}
                <aside className="results-panel">
                    <div className="results-header">
                        <h2>Solutions</h2>
                        <div className="header-actions">
                            <button
                                className="share-btn"
                                onClick={handleShare}
                                title="Share this puzzle"
                            >
                                {copied ? (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                                        Share
                                    </>
                                )}
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
                        <h3>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            Statistics
                        </h3>
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
                                <div className="stat-value">{appStats.totalTimeMs > 0 ? (appStats.totalTimeMs / 1000).toFixed(2) : '0.00'}</div>
                                <div className="stat-label">Time (s)</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">
                                    {appStats.puzzlesAttempted > 0 
                                        ? Math.min(100, Math.round((appStats.totalSolved / appStats.puzzlesAttempted) * 100)) 
                                        : 0}%
                                </div>
                                <div className="stat-label">Success Rate</div>
                            </div>
                        </div>
                    </div>

                    {/* History Panel */}
                    <div className="history-panel">
                        <div className="history-header">
                            <h3>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                Recent
                            </h3>
                            {history.length > 0 && (
                                <button className="history-clear" onClick={handleClearHistory}>
                                    Clear All
                                </button>
                            )}
                        </div>
                        {history.length === 0 ? (
                            <div className="empty-history">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>No history yet</span>
                            </div>
                        ) : (
                            <div className="history-list">
                                {history.slice(0, 10).map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="history-item"
                                        onClick={() => handleHistorySelect(item)}
                                    >
                                        <div className={`history-item-expr ${item.success ? 'success' : 'error'}`}>
                                            {item.expression}
                                        </div>
                                        <div className="history-item-time">
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}