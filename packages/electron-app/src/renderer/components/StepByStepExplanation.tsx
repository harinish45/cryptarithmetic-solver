// ============================================================
// StepByStepExplanation — Educational Step-by-Step Display
// ============================================================

import React, { useState } from 'react';
import type { SolveStep, DigitMapping } from '@cryptarithmetic/shared';

interface StepByStepExplanationProps {
    steps: SolveStep[];
}

const actionIcons: Record<string, JSX.Element> = {
    deduction: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
    ),
    constraint: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    ),
    assignment: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    ),
    backtrack: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
    ),
    verification: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
        </svg>
    ),
    conclusion: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    ),
};

const actionColors: Record<string, string> = {
    deduction: 'var(--color-primary)',
    constraint: 'var(--color-warning)',
    assignment: 'var(--color-success)',
    backtrack: 'var(--color-error)',
    verification: 'var(--color-info)',
    conclusion: 'var(--color-success)',
};

export function StepByStepExplanation({ steps }: StepByStepExplanationProps) {
    const [expandedStep, setExpandedStep] = useState<number | null>(1);

    const toggleStep = (stepNumber: number) => {
        setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
    };

    if (!steps || steps.length === 0) {
        return (
            <div className="step-by-step-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No step-by-step explanation available for this solution.</p>
            </div>
        );
    }

    return (
        <div className="step-by-step-container">
            <div className="step-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <h3>Step-by-Step Solution</h3>
                <span className="step-count">{steps.length} steps</span>
            </div>

            <div className="steps-timeline">
                {steps.map((step, index) => {
                    const isExpanded = expandedStep === step.stepNumber;
                    const isLast = index === steps.length - 1;

                    return (
                        <div 
                            key={step.stepNumber}
                            className={`step-card ${isExpanded ? 'expanded' : ''} ${step.action}`}
                            style={{ '--step-color': actionColors[step.action] } as React.CSSProperties}
                        >
                            <div 
                                className="step-header-row"
                                onClick={() => toggleStep(step.stepNumber)}
                            >
                                <div className="step-indicator">
                                    <div className="step-dot" style={{ backgroundColor: actionColors[step.action] }}>
                                        {actionIcons[step.action]}
                                    </div>
                                    {!isLast && <div className="step-line" />}
                                </div>
                                
                                <div className="step-content-preview">
                                    <div className="step-title-row">
                                        <span className="step-number">Step {step.stepNumber}</span>
                                        <span className="step-action-badge" style={{ backgroundColor: `${actionColors[step.action]}20`, color: actionColors[step.action] }}>
                                            {step.action.charAt(0).toUpperCase() + step.action.slice(1)}
                                        </span>
                                        <svg 
                                            className={`step-chevron ${isExpanded ? 'expanded' : ''}`} 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </div>
                                    <h4 className="step-title">{step.title}</h4>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="step-details">
                                    <p className="step-description">{step.description}</p>
                                    
                                    {step.highlight && step.highlight.length > 0 && (
                                        <div className="step-highlights">
                                            <span className="highlight-label">Key letters:</span>
                                            <div className="highlight-chips">
                                                {step.highlight.map(letter => (
                                                    <span key={letter} className="highlight-chip">{letter}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step.mapping && (
                                        <div className="step-mapping">
                                            <span className="mapping-label">Digit Assignment:</span>
                                            <div className="mapping-grid">
                                                {Object.entries(step.mapping).sort((a, b) => a[0].localeCompare(b[0])).map(([letter, digit]) => (
                                                    <div key={letter} className="mapping-item">
                                                        <span className="mapping-letter">{letter}</span>
                                                        <span className="mapping-arrow">→</span>
                                                        <span className="mapping-digit">{digit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step.equation && (
                                        <div className="step-equation">
                                            <span className="equation-label">Verification:</span>
                                            <code className="equation-code">{step.equation}</code>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}