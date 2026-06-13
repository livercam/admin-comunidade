import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Redireciona todas as rotas não-encontradas para o index.html
    // Isso permite que o React Router lide com as rotas no lado do cliente
    historyApiFallback: true,
  },
})
