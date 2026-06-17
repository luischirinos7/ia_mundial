// scripts/patch-db.ts
import { db } from '../lib/db/client';

console.log('🔧 Parcheando la base de datos...');

try {
  db.prepare('ALTER TABLE fixtures ADD COLUMN home_score INTEGER DEFAULT NULL').run();
  db.prepare('ALTER TABLE fixtures ADD COLUMN away_score INTEGER DEFAULT NULL').run();
  db.prepare('ALTER TABLE fixtures ADD COLUMN ai_processed INTEGER DEFAULT 0').run();
  console.log('✅ Columnas de aprendizaje (goles y estado IA) añadidas correctamente.');
} catch (e) {
  console.log('⚠️ Nota: Las columnas ya existen o no necesitan actualizarse.');
}