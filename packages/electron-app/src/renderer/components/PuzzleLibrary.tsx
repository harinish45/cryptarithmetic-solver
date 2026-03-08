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
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const filtered = useMemo(() => {
        return puzzles.filter((p) => {
            const matchesSearch =
                !search ||
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.expression.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === 'all' || p.difficulty === filter;
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            return matchesSearch && matchesFilter && matchesCategory;
        });
    }, [search, filter, categoryFilter]);

    const difficulties: Array<Difficulty | 'all'> = ['all', 'easy', 'medium', 'hard'];

    // Extract unique categories from puzzles
    const categories = useMemo(() => {
        const cats = new Set<string>();
        puzzles.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return ['all', ...Array.from(cats).sort()];
    }, []);

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

            <div className="filter-section">
                <div className="filter-label">Difficulty</div>
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
            </div>

            <div className="filter-section">
                <div className="filter-label">Category</div>
                <div className="filter-chips category-chips">
                    {categories.slice(0, 6).map((cat) => (
                        <button
                            key={cat}
                            className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(cat)}
                            title={cat}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>
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
                            <div className="puzzle-item-meta">
                                <span
                                    className={`puzzle-item-badge badge-${puzzle.difficulty}`}
                                >
                                    {puzzle.difficulty}
                                </span>
                                {puzzle.category && (
                                    <span className="puzzle-category">{puzzle.category}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="library-footer">
                <span>{puzzles.length} puzzles available</span>
            </div>
        </nav>
    );
}
