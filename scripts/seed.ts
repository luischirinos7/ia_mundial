import 'dotenv/config'; // Esto carga automáticamente el .env.local
import { db } from '../lib/db/client';
import { fetchFootballData } from '../lib/data/api';
// ... resto de tu código

const seedTeams = async () => {
  console.log('Obteniendo datos de Football-Data...');
  
  // Endpoint para obtener equipos de la competición (ejemplo: WC 2022 o ligas)
  const data = await fetchFootballData('/competitions/WC/teams'); 
  
  if (data && data.teams) {
    const insertStmt = db.prepare(`
      INSERT INTO teams (id, name, code, fifa_ranking, offense_rating, defense_rating)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name
    `);

    const insertMany = db.transaction((teams) => {
      for (const t of teams) {
        insertStmt.run(t.id, t.name, t.tla || 'N/A', 0, 1.0, 1.0);
      }
    });

    insertMany(data.teams);
    console.log(`¡Éxito! Se inyectaron ${data.teams.length} equipos.`);
  }
};

seedTeams();