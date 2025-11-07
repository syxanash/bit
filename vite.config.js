import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa';
// import netlify from '@netlify/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert(),
    // netlify(),
    VitePWA({ registerType: 'autoUpdate' }),
    {
      name: 'isolation',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
      },
    },
  ],
})
