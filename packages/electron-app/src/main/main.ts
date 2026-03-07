// ============================================================
// Electron Main Process — Cryptarithmetic Solver
// ============================================================

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { Worker } from 'worker_threads';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 600,
        title: 'Cryptarithmetic Solver',
        backgroundColor: '#0f172a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
        },
        show: false,
    });

    // Graceful show
    mainWindow.once('ready-to-show', () => mainWindow?.show());

    // In dev, load from Vite dev server; in production, load built files
    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ── IPC Handlers ─────────────────────────────────────────────

ipcMain.handle('solve-puzzle', async (_event, request) => {
    return new Promise((resolve) => {
        const worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData: request,
        });

        worker.on('message', (msg) => {
            if (msg.type === 'result') {
                resolve(msg.data);
                worker.terminate();
            }
        });

        worker.on('error', (err) => {
            resolve({
                success: false,
                solutions: [],
                stats: {
                    algorithm: request.algorithm,
                    solveTimeMs: 0,
                    nodesExplored: 0,
                    backtracks: 0,
                    solutionsFound: 0,
                },
                error: err.message,
            });
        });
    });
});

ipcMain.handle('export-solution', async (_event, { data, format, filename }) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: filename || `solution.${format}`,
        filters: [
            {
                name: format === 'json' ? 'JSON Files' : 'CSV Files',
                extensions: [format],
            },
        ],
    });

    if (result.canceled || !result.filePath) {
        return { success: false };
    }

    try {
        fs.writeFileSync(result.filePath, data, 'utf-8');
        return { success: true, path: result.filePath };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
});

// ── App Lifecycle ────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
