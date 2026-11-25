import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // On Vercel, refuse to build without the backend address; otherwise the live site
  // would silently call http://127.0.0.1:8000 on each visitor's own machine.
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'production' && process.env.VERCEL && !env.VITE_API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Add it in Vercel -> Project -> Settings -> Environment Variables ' +
        '(e.g. https://payguard-api.onrender.com) and redeploy.',
    )
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
    },
  }
})
