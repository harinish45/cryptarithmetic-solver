# 🤖 AI Agent Engineering Guidelines

1. **Deterministic Solution Ordering:** If multiple assignments are valid, sort solutions deterministically by leading letter digit value.
2. **Never Allow More Than 10 Unique Letters:** An input puzzle with > 10 unique characters cannot be solved in base 10; reject immediately with an `InvalidAlphabetSizeError`.
