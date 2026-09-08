# 📋 Product Requirements Document (PRD)
## Project: Cryptarithmetic Solver Core & Desktop Laboratory
**Version:** 1.0.0-PROD  
**Author:** Harinish S V ([@harinish45](https://github.com/harinish45))

---

## 1. Problem Formulation
Cryptarithmetic is a class of mathematical puzzles where digits are replaced by alphabet letters. In the canonical puzzle `SEND + MORE = MONEY`, each letter corresponds to a unique digit between `0` and `9`, leading letters cannot be zero, and the arithmetic sum must hold true.

## 2. CSP Formal Definition
* **Variables:** $X = \{L_1, L_2, \dots, L_n\}$ where $n \le 10$.
* **Domains:** $D_i = \{0, 1, 2, 3, 4, 5, 6, 7, 8, 9\}$ for all variables; $D_{\text{lead}} = \{1, 2, \dots, 9\}$.
* **Constraints:**
  1. $\text{AllDifferent}(L_1, L_2, \dots, L_n)$
  2. $\sum_{i=1}^m \text{Value}(\text{Word}_i) = \text{Value}(\text{Result})$
  3. Column-wise carry propagation constraints: $c_k + \sum \text{digits} = \text{result\_digit} + 10 \cdot c_{k+1}$
