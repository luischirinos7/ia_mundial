// lib/db/actions.ts
import { db } from './client';

export async function getMatchPredictions(fixtureId: number) {
  try {
    const matchResult = await db.execute({
      sql: `SELECT f.*, h.name as home_name, a.name as away_name 
            FROM fixtures f 
            JOIN teams h ON f.home_team_id = h.id 
            JOIN teams a ON f.away_team_id = a.id 
            WHERE f.id = ?`,
      args: [fixtureId]
    });

    const predictionResult = await db.execute({
      sql: `SELECT * FROM predictions WHERE fixture_id = ?`,
      args: [fixtureId]
    });

    if (matchResult.rows.length === 0) {
      return { fixture: null, prediction: null };
    }

    const fixture = matchResult.rows[0];
    const prediction = predictionResult.rows.length > 0 ? predictionResult.rows[0] : null;

    return { fixture, prediction };
  } catch (error) {
    console.error("Error leyendo de Turso:", error);
    return { fixture: null, prediction: null };
  }
}