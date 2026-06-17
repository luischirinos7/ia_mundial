// scripts/seed-fixtures.ts
import { db } from '../lib/db/client';

// 1. Obtenemos los 4 primeros equipos reales que la API guardó en tu BD
const teams = db.prepare('SELECT id, name FROM teams LIMIT 4').all() as { id: number, name: string }[];

if (teams.length < 4) {
  console.error('Error: No hay suficientes equipos. Ejecuta pnpm db:seed primero.');
  process.exit(1);
}

console.log(`Creando partidos con: ${teams.map(t => t.name).join(', ')}`);

// 2. Preparamos el insert (sin forzar el ID del partido para que sea automático)
const insertFixtures = db.prepare(`
  INSERT INTO fixtures (home_team_id, away_team_id, date, status, stage)
  VALUES (?, ?, ?, ?, ?)
`);

// 3. Insertamos usando los IDs reales
insertFixtures.run(teams[0].id, teams[1].id, '2026-06-11', 'SCHEDULED', 'GROUP_STAGE');
insertFixtures.run(teams[2].id, teams[3].id, '2026-06-12', 'SCHEDULED', 'GROUP_STAGE');

console.log('¡Partidos de prueba inyectados con éxito!');