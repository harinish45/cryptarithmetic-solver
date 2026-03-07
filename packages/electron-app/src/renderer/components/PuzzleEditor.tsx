// ============================================================
// PuzzleEditor — Monospace input with validation
// ============================================================

import React, { useRef, useMemo, useCallback } from 'react';

interface PuzzleEditorProps {
    expression: string;
    onChange: (value: string) => void;
    onSolve: () => void;
}

export function PuzzleEditor({ expression, onChange, onSolve }: PuzzleEditorProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const validation = useMemo(() => {
        const trimmed = expression.trim().toUpperCase();
        if (!trimmed) return { valid: false, message: '', uniqueCount: 0 };

        // Check for valid characters
        if (/[^A-Z +\-*/=]/.test(trimmed)) {
            return { valid: false, message: 'Only letters, operators (+−×÷), and = are allowed', uniqueCount: 0 };
        }

        // Check for = sign
        if (!trimmed.includes('=')) {
            return { valid: false, message: 'Add an = sign to complete the equation', uniqueCount: 0 };
        }

        // Count unique letters
        const letters = trimmed.replace(/[^A-Z]/g, '');
        const unique = new Set(letters);
        const uniqueCount = unique.size;

        if (uniqueCount > 10) {
            return { valid: false, message: `Too many unique letters (${uniqueCount}/10 max)`, uniqueCount };
        }

        if (uniqueCount === 0) {
            return { valid: false, message: 'Enter at least one letter', uniqueCount };
        }

        // Basic structure check: words on both sides of =
        const parts = trimmed.split('=').map(s => s.trim());
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            return { valid: false, message: 'Invalid equation format', uniqueCount };
        }

        return { valid: true, message: `${uniqueCount} unique letters`, uniqueCount };
    }, [expression]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value.toUpperCase());
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && validation.valid) {
            onSolve();
        }
    }, [validation.valid, onSolve]);

    const letterCountClass = validation.uniqueCount === 0
        ? ''
        : validation.uniqueCount <= 8
            ? 'ok'
            : validation.uniqueCount <= 10
                ? 'warn'
                : 'over';

    const inputClass = !expression.trim()
        ? ''
        : validation.valid
            ? 'valid'
            : 'invalid';

    return (
        <div className="puzzle-input-container">
            <div className="puzzle-input-label">
                <span>Puzzle Expression</span>
                {validation.uniqueCount > 0 && (
                    <span className={`letter-count ${letterCountClass}`}>
                        {validation.uniqueCount}/10
                    </span>
                )}
            </div>
            <input
                ref={inputRef}
                id="puzzle-input"
                className={`puzzle-input ${inputClass}`}
                type="text"
                value={expression}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="SEND + MORE = MONEY"
                autoFocus
                spellCheck={false}
                autoComplete="off"
            />
            <div className={`validation-msg ${expression.trim() ? 'visible' : ''} ${validation.valid ? 'success' : 'error'}`}>
                {validation.message}
            </div>
        </div>
    );
}
