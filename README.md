# 🧩 Cryptarithmetic Puzzle Solver

> **High-performance TypeScript solver for Cryptarithmetic Constraint Satisfaction Problems (CSP) featuring Backtracking, Minimum Remaining Values (MRV), Forward Checking, and a premium, animated UI/UX with step-by-step educational explanations.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## ✨ Features

- **🎓 Step-by-Step Learning**: Detailed, interactive educational explanations showing exactly how the puzzle is solved column by column
- **🎨 Premium UI/UX**: Glassmorphism design, micro-animations, perfect rounded corners, and responsive layout
- **⚡ High Performance**: Multiple solving algorithms (Hybrid, Backtracking, MRV, Forward Checking)
- **🌐 Web & Desktop Ready**: Deployable on Vercel or run locally as an Electron app
- **📊 Real-time Statistics**: Track solved puzzles, success rate, and performance metrics
- **💾 Local History**: Automatically saves your recent puzzles and solving statistics
- **🔗 Shareable Puzzles**: Generate shareable URLs for any puzzle
- **🌓 Dark/Light Mode**: Beautiful theme switching with smooth transitions

---

## 🏛️ Monorepo Architecture

```
cryptarithmetic-solver/
├── packages/
│   ├── solver-core/       # Core CSP algorithms: MRV, LCV, Forward Checking, Backtracking, Step-by-Step
│   ├── electron-app/      # Web/Electron interface with premium visual design
│   └── shared/            # Common domain types, AST expression parser, and validator
├── vercel.json            # Vercel deployment configuration
└── package.json           # Workspace root
```

---

## 🚀 Core Algorithmic Techniques

- **Minimum Remaining Values (MRV)**: Prioritizes assigning values to the variable with the fewest remaining legal choices
- **Least Constraining Value (LCV)**: Prefers values that rule out the fewest choices for neighboring variables
- **Forward Checking & Arc Consistency (AC-3)**: Propagates constraints across arithmetic columns after every assignment
- **Educational Step Generation**: Analyzes column constraints, leading letter rules, and final verification to create human-readable learning steps

---

## 📦 Quick Start

### Installation
```bash
git clone https://github.com/harinish45/cryptarithmetic-solver.git
cd cryptarithmetic-solver
npm install
```

### Running Locally (Development)
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

---

## 🌐 Vercel Deployment

This project is fully configured for seamless Vercel deployment:

1. **Connect your GitHub repository** to Vercel
2. Vercel will automatically detect the `vercel.json` configuration
3. Ensure the build settings point to the correct root (or use the root `vercel.json`)
4. Click **Deploy** - that's it!

The deployment includes:
- Vite-optimized static assets
- Serverless API routes for puzzle solving (`/api/solve`)
- Automatic SPA routing fallbacks

---

## 🎮 How to Use

1. **Enter a Puzzle**: Type your cryptarithmetic equation (e.g., `SEND + MORE = MONEY`)
2. **Select Algorithm**: Choose your preferred solving strategy from the dropdown (Hybrid recommended for step-by-step)
3. **Click Solve**: Hit the Solve button or press `Ctrl + Enter`
4. **Learn from the Solution**: Expand the "Step-by-Step Solution" panel to see:
   - Leading letter constraints
   - Column-by-column arithmetic analysis
   - Final digit mapping
   - Mathematical verification
5. **View Results**: See the letter mappings, performance stats, and save to history

### Supported Operators
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Equality: `=`

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**Crafted with ❤️ by Harinish**