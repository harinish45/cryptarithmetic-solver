// ============================================================
// Preload Script — Safe IPC Bridge
// ============================================================

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('solverAPI', {
    solvePuzzle: (request: {
        expression: string;
        algorithm: string;
        maxSolutions: number;
    }) => ipcRenderer.invoke('solve-puzzle', request),

    exportSolution: (params: {
        data: string;
        format: string;
        filename?: string;
    }) => ipcRenderer.invoke('export-solution', params),
});
