# 🧩 Cryptarithmetic Puzzle Solver & AI Constraint Laboratory
> **High-performance TypeScript & Electron solver for Cryptarithmetic Constraint Satisfaction Problems (CSP) featuring Backtracking, Minimum Remaining Values (MRV), Forward Checking, and AC-3 Arc Consistency.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Monorepo: npm workspaces](https://img.shields.io/badge/Monorepo-Workspaces-purple.svg)]()
[![Status: Active](https://img.shields.io/badge/Status-Active%20v1.0.0-brightgreen.svg)]()

---

## 🏛️ Monorepo Architecture

```
cryptarithmetic-solver/
├── packages/
│   ├── solver-core/       # Core CSP algorithms: MRV, LCV, Forward Checking, Backtracking
│   ├── electron-app/      # Cross-platform desktop interface with visual step-by-step solver
│   └── shared/            # Common domain types, AST expression parser, and validator
└── package.json           # Workspace root
```

```mermaid
graph TD
    A["Input Equation: SEND + MORE = MONEY"] --> B[AST Parser & Letter Extractor]
    B --> C[Constraint Satisfaction Problem - CSP Formulation]
    C --> D[Variable Domains: Digits 0 - 9]
    C --> E[All-Different Global Constraint]
    C --> F[Leading Letter != 0 Constraint]
    C --> G[Arithmetic Column Balance Constraints]
    D & E & F & G --> H[Heuristic Search Engine: MRV + LCV + Forward Checking]
    H --> I[Backtracking Search with State Pruning]
    I -->|Valid Assignment Found| J["Solution: O=0, M=1, Y=2, E=5, N=6, D=7, R=8, S=9"]
```

---

## 🚀 Core Algorithmic Techniques

* **Minimum Remaining Values (MRV):** Prioritizes assigning values to the variable with the fewest remaining legal choices, triggering failure branches as early as possible.
* **Least Constraining Value (LCV):** Prefers values that rule out the fewest choices for neighboring variables in the constraint graph.
* **Forward Checking & Arc Consistency (AC-3):** Propagates constraints across arithmetic columns after every assignment, pruning invalid search space branches.

---

## 📦 Quick Start

### Installation
```bash
git clone https://github.com/harinish45/cryptarithmetic-solver.git
cd cryptarithmetic-solver
npm install
```

### Running Solver Core Tests
```bash
npm run test --workspace=packages/solver-core
```

### Launching Desktop UI
```bash
npm run start --workspace=packages/electron-app
```

---

## 🤖 Vibe Coding & Autonomous AI Tool Instructions
* [`PRD.md`](./PRD.md) — Formal CSP definition and mathematical specifications.
* [`TODO.md`](./TODO.md) — Atomic implementation checklist with unit test acceptance criteria.
* [`AGENTS.md`](./AGENTS.md) — Algorithmic invariants and coding rules.

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
