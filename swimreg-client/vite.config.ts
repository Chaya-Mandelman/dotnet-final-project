import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// פורט קבוע: השרת מאשר CORS רק ל-http://localhost:5173. אם הפורט תפוס, Vite ייכשל במקום לעבור לפורט אחר.
export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true } })
