import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

/**
 * Post-processes vite-plugin-electron-renderer's generated CJS shims
 * to replace bare `require()` calls with `createRequire()` from Node's
 * module system. This is needed because Vite serves everything as ESM
 * (<script type="module">) where `require` is not defined, even with
 * Electron's nodeIntegration enabled.
 */
function fixRendererShims(): Plugin {
  return {
    name: 'fix-renderer-cjs-shims',
    configureServer(server) {
      // Intercept requests to the .vite-electron-renderer shim files
      server.middlewares.use((_req, _res, next) => {
        next()
      })
    },
    transform(code, id) {
      // Only process the generated .mjs shims from vite-electron-renderer
      if (id.includes('.vite-electron-renderer') && id.endsWith('.mjs')) {
        // Replace `const avoid_parse_require = require;`
        // with window.require to access Electron's injected require
        if (code.includes('const avoid_parse_require = require;')) {
          code = code.replace('const avoid_parse_require = require;', 'const avoid_parse_require = window.require;')
        }
        return { code, map: null }
      }
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      { entry: 'electron/main.ts' },
      {
        entry: 'electron/preload.ts',
        onstart(args) { args.reload() },
      },
    ]),
    renderer({
      resolve: {
        realm: { type: 'cjs' },
      },
    }),
    fixRendererShims(),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  optimizeDeps: {
    exclude: ['realm'],
  },
  build: {
    rollupOptions: {
      external: ['realm'],
    },
  },
})
