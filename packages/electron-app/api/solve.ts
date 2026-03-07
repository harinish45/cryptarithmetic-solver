import { VercelRequest, VercelResponse } from '@vercel/node';
import { solvePuzzle } from '@cryptarithmetic/solver-core';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { expression, algorithm, maxSolutions } = req.body;

        if (!expression) {
            return res.status(400).json({ error: 'Missing expression' });
        }

        const result = solvePuzzle(
            expression,
            algorithm || 'hybrid',
            maxSolutions || 10
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            solutions: [],
            stats: {
                algorithm: req.body?.algorithm || 'hybrid',
                solveTimeMs: 0,
                nodesExplored: 0,
                backtracks: 0,
                solutionsFound: 0,
            },
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
