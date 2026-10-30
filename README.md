<div align="center">

# 🧩 Cryptarithmetic Puzzle Solver

**High-Performance CSP Solver with Interactive Visualizer**

[![CI](https://github.com/harinish45/cryptarithmetic-solver/actions/workflows/ci.yml/badge.svg)](https://github.com/harinish45/cryptarithmetic-solver/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel)](vercel.json)

> *Solves SEND + MORE = MONEY in milliseconds using Backtracking + MRV + AC-3 with step-by-step visual exploration*

**Try: `SEND + MORE = MONEY` → solution in <5ms**

[📋 TODO](TODO.md) · [📄 PRD](PRD.md) · [🔍 Live Demo](#)

</div>

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Input["📥 Input"]
        Puzzle["Puzzle String\n(e.g. SEND+MORE=MONEY)"]
    end

    subgraph Core["⚙️ @cryptarithmetic/core"]
        Parser["🔤 Puzzle Parser\n(tokenize letters)"]
        CSP["🧮 CSP Formulator\n(variables + constraints)"]
        AC3["📐 AC-3\n(Arc Consistency)"]
        MRV["🎯 MRV Heuristic\n(variable ordering)"]
        LCV["📊 LCV Heuristic\n(value ordering)"]
        Backtrack["🔙 Backtracking\nSearch"]
    end

    subgraph Output["📤 Output"]
        Solution["✅ Solution\n(digit mapping)"]
        Steps["📋 Trace Steps\n(search tree)"]
        Metrics["📊 Performance\n(nodes explored)"]
    end

    Puzzle --> Parser
    Parser --> CSP
    CSP --> AC3
    AC3 --> MRV
    MRV --> LCV
    LCV --> Backtrack
    Backtrack --> Solution
    Backtrack --> Steps
    Backtrack --> Metrics
```

---

## 🔍 Search Algorithm Flow

```mermaid
flowchart TD
    A[Parse puzzle into CSP] --> B[Run AC-3 arc consistency]
    B --> C{Domain empty?}
    C -->|Yes| Z[❌ No solution]
    C -->|No| D[Select var via MRV heuristic]
    D --> E[Order values via LCV]
    E --> F[Assign value]
    F --> G[Forward checking]
    G --> H{Consistent?}
    H -->|No| I[Backtrack]
    I --> E
    H -->|Yes| J{All vars assigned?}
    J -->|No| D
    J -->|Yes| K[✅ Solution found!]
```

---

## 🏎️ Performance

| Puzzle | Variables | Solution Time |
|--------|-----------|---------------|
| SEND + MORE = MONEY | 8 | ~3ms |
| BASE + BALL = GAMES | 8 | ~5ms |
| FORTY + TEN + TEN = SIXTY | 10 | ~12ms |

---

## 🚀 Quick Start

```bash
git clone https://github.com/harinish45/cryptarithmetic-solver.git
cd cryptarithmetic-solver
npm install
npm run dev          # Web UI → http://localhost:5173

# Or use the core package directly
cd packages/core
npx ts-node solve.ts "SEND+MORE=MONEY"
```

---

## 📦 Monorepo Structure

```
cryptarithmetic-solver/
├── 📦 packages/
│   ├── core/        # CSP solver engine (TypeScript)
│   ├── web/         # React web interface (Vite)
│   └── cli/         # Command-line interface
└── ⚙️  tsconfig.json
```

---

<div align="center">
<a href="LICENSE">MIT License</a> · Built by harinish45
</div>