// lib/db/client.ts
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// 1. Cargamos las variables locales SOLO si no estamos en producción (Vercel)
if (!process.env.VERCEL) {
  dotenv.config({ path: '.env.local' });
}

// 2. Ahora sí, nos conectamos con la seguridad de que las variables existen
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});