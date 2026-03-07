// ============================================================
// PerformanceStats — Solve time, nodes, backtracks
// ============================================================

import React from 'react';
import type { SolveStats } from '@cryptarithmetic/shared';

interface PerformanceStatsProps {
    stats: SolveStats;
}

function formatTime(ms: number): string {
    if (ms < 1) return '<1 ms';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

export function PerformanceStats({ stats }: PerformanceStatsProps) {
    return (
        <div className="stats-panel">
            <h3>Performance</h3>
            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-label">Time</div>
                    <div className="stat-value">{formatTime(stats.solveTimeMs)}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Nodes</div>
                    <div className="stat-value">{formatNumber(stats.nodesExplored)}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Backtracks</div>
                    <div className="stat-value">{formatNumber(stats.backtracks)}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Solutions</div>
                    <div className="stat-value">{stats.solutionsFound}</div>
                </div>
            </div>
        </div>
    );
}
