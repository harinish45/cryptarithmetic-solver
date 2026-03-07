import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: path.join(__dirname, 'src/renderer'),
    base: './',
    build: {
        outDir: path.join(__dirname, process.env.VERCEL ? 'dist' : 'dist/renderer'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@cryptarithmetic/shared': path.join(__dirname, '../shared/src/index.ts'),
            '@cryptarithmetic/solver-core': path.join(__dirname, '../solver-core/src/index.ts'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            }
        }
    },
});
