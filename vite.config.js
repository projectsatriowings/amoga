import react from '@vitejs/plugin-react'
import { defineConfig, createLogger } from 'vite'

const logger = createLogger()
const originalError = logger.error

logger.error = (msg, options) => {
  // Suppress transient proxy connection errors while the backend server is reloading
  if (
    typeof msg === 'string' &&
    msg.includes('http proxy error') &&
    (msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET'))
  ) {
    return
  }
  originalError(msg, options)
}

// https://vite.dev/config/
export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            // Gracefully handle expected transient disconnects during server restarts
            if (['ECONNRESET', 'ECONNREFUSED'].includes(err.code)) {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(503, {
                  'Retry-After': '2',
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({ error: 'Server restarting, please retry.' }));
              }
              return;
            }
            console.error('[vite] Proxy error:', err.message);
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
})
