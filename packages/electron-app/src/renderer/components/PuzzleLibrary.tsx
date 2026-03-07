// ============================================================
// PuzzleLibrary — Left sidebar with built-in puzzles
// ============================================================

import React, { useState, useMemo } from 'react';
import type { LibraryPuzzle, Difficulty } from '@cryptarithmetic/shared';
import puzzlesData from '../../data/puzzle-library.json';

const puzzles: LibraryPuzzle[] = puzzlesData as LibraryPuzzle[];

interface PuzzleLibraryProps {
    selectedExpression: string;
    onSelectPuzzle: (puzzle: LibraryPuzzle) => void;
}

export function PuzzleLibrary({ selectedExpression, onSelectPuzzle }: PuzzleLibraryProps) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Difficulty | 'all'>('all');

    const filtered = useMemo(() => {
        return puzzles.filter((p) => {
            const matchesSearch =
                !search ||
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.expression.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === 'all' || p.difficulty === filter;
            return matchesSearch && matchesFilter;
        });
    }, [search, filter]);

    const difficulties: Array<Difficulty | 'all'> = ['all', 'easy', 'medium', 'hard'];

    return (
        <nav className="sidebar">
            <div className="sidebar-header">
                <h2>Puzzle Library</h2>
                <input
                    id="library-search"
                    className="search-input"
                    type="text"
                    placeholder="Search puzzles…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="filter-chips">
                {difficulties.map((d) => (
                    <button
                        key={d}
                        className={`filter-chip ${filter === d ? 'active' : ''}`}
                        onClick={() => setFilter(d)}
                    >
                        {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
            </div>

            <div className="puzzle-list">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <div className="empty-desc">No matching puzzles</div>
                    </div>
                ) : (
                    filtered.map((puzzle) => (
                        <div
                            key={puzzle.id}
                            className={`puzzle-item ${selectedExpression === puzzle.expression ? 'active' : ''
                                }`}
                            onClick={() => onSelectPuzzle(puzzle)}
                        >
                            <div className="puzzle-item-title">{puzzle.title}</div>
                            <div className="puzzle-item-expr">{puzzle.expression}</div>
                            <span
                                className={`puzzle-item-badge badge-${puzzle.difficulty}`}
                            >
                                {puzzle.difficulty}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </nav>
    );
}
