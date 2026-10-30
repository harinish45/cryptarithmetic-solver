# 📋 TODO & Master Plan — cryptarithmetic-solver

> **Project**: High-Performance Cryptarithmetic CSP Solver
> **Stack**: TypeScript, Monorepo (packages/), Vercel
> **Status**: 🟡 In Progress (~65%)
> **Last Updated**: 2026-10-30

## 🏗️ Architecture
\\\
cryptarithmetic-solver/
├── packages/
│   ├── core/          # CSP solver engine
│   ├── web/           # React web UI
│   └── cli/           # Command-line interface
├── AGENTS.md
├── PRD.md
├── vercel.json
└── tsconfig.json
\\\

## ✅ Completed
- [x] Monorepo structure (packages/)
- [x] TypeScript config
- [x] Vercel deployment config
- [x] PRD + AGENTS.md documentation
- [x] LICENSE

## 🔧 In Progress
- [ ] Core CSP solver (backtracking + AC3)
- [ ] Web UI for puzzle input
- [ ] Solution visualization

## 🚀 Roadmap

### Phase 1 — Core Solver (Nov 2026)
- [ ] Backtracking search with constraint propagation
- [ ] AC-3 arc consistency algorithm
- [ ] Forward checking optimization
- [ ] MRV (Minimum Remaining Values) heuristic
- [ ] Degree heuristic for variable ordering
- [ ] LCV (Least Constraining Value) heuristic

### Phase 2 — Web Interface (Nov–Dec 2026)
- [ ] Puzzle input form (e.g. SEND + MORE = MONEY)
- [ ] Solution steps visualization
- [ ] Search tree explorer (interactive)
- [ ] Performance metrics display (nodes explored, time)
- [ ] Multiple solutions enumeration

### Phase 3 — CLI & API (Jan 2027)
- [ ] CLI: \
px cryptarithmetic-solver "SEND+MORE=MONEY"\
- [ ] REST API for programmatic access
- [ ] Batch puzzle solver (CSV input)
- [ ] Benchmark suite (classic puzzles)

### Phase 4 — Polish (Feb 2027)
- [ ] Puzzle generator (random valid puzzles)
- [ ] Difficulty rating
- [ ] Shareable puzzle URLs
- [ ] Tutorial mode (educational)

## 📊 Classic Puzzles Support
| Puzzle | Implemented | Notes |
|--------|-------------|-------|
| SEND + MORE = MONEY | ❌ | Classic 2-addend |
| BASE + BALL = GAMES | ❌ | |
| EAT + THAT = APPLE | ❌ | 3-addend |
| FORTY + TEN + TEN = SIXTY | ❌ | Multi-addend |