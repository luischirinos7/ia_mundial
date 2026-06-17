// scripts/cron.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db } from '../lib/db/client';
import { calculateMatchProbabilities } from '../lib/model/poisson';

const LEARNING_RATE = 0.1;

const runEngine = async () => {
  console.log('🧠 Iniciando IA: Ajustando ratings en Turso con resultados reales...');
  
  try {
    // 1. Aprender de partidos finalizados no procesados
    const finishedRes = await db.execute(`
      SELECT f.*, h.offense_rating as h_off, h.defense_rating as h_def, a.offense_rating as a_off, a.defense_rating as a_def
      FROM fixtures f 
      JOIN teams h ON f.home_team_id = h.id 
      JOIN teams a ON f.away_team_id = a.id
      WHERE f.status = 'FINISHED' AND f.ai_processed = 0
    `);

    const finished = finishedRes.rows as any[];

    // Turso maneja transacciones por medio de lotes (batch) o ejecutando consultas secuenciales con await
    for (const m of finished) {
      const h_err = m.home_score - (m.h_off * m.a_def);
      const a_err = m.away_score - (m.a_off * m.h_def);

      // Actualizar stats del equipo local
      await db.execute({
        sql: 'UPDATE teams SET offense_rating = ?, defense_rating = ? WHERE id = ?',
        args: [Math.max(0.5, m.h_off + h_err * LEARNING_RATE), Math.max(0.4, m.h_def + a_err * LEARNING_RATE), m.home_team_id]
      });

      // Actualizar stats del equipo visitante
      await db.execute({
        sql: 'UPDATE teams SET offense_rating = ?, defense_rating = ? WHERE id = ?',
        args: [Math.max(0.5, m.a_off + a_err * LEARNING_RATE), Math.max(0.4, m.a_def + h_err * LEARNING_RATE), m.away_team_id]
      });

      // Marcar partido como procesado por la IA
      await db.execute({
        sql: 'UPDATE fixtures SET ai_processed = 1 WHERE id = ?',
        args: [m.id]
      });
    }

    // 2. Borrar predicciones SOLO de los partidos que NO han terminado
    await db.execute(`
      DELETE FROM predictions 
      WHERE fixture_id IN (SELECT id FROM fixtures WHERE status != 'FINISHED')
    `);
    
    // 3. Obtener TODOS los partidos que no tengan predicción asignada en Turso
    const fixturesRes = await db.execute(`
      SELECT f.id, h.offense_rating as h_off, h.defense_rating as h_def, a.offense_rating as a_off, a.defense_rating as a_def 
      FROM fixtures f 
      JOIN teams h ON f.home_team_id = h.id 
      JOIN teams a ON f.away_team_id = a.id 
      LEFT JOIN predictions p ON f.id = p.fixture_id
      WHERE p.fixture_id IS NULL
    `);

    const fixtures = fixturesRes.rows as any[];
    
    for (const f of fixtures) {
      const stats = calculateMatchProbabilities(f.h_off * f.a_def, f.a_off * f.h_def);
      
      await db.execute({
        sql: `INSERT INTO predictions (fixture_id, home_win_prob, draw_prob, away_win_prob, over_2_5_prob, btts_prob, top_scores) 
              VALUES (?, ?, ?, ?, ?, ?, ?) 
              ON CONFLICT(fixture_id) DO NOTHING`,
        args: [
          f.id, 
          stats.homeWin, 
          stats.draw, 
          stats.awayWin, 
          stats.over2_5, 
          stats.bttsYes, 
          JSON.stringify(stats.exactScores)
        ]
      });
    }

    console.log('✅ Base de datos remota actualizada con nuevas probabilidades.');
  } catch (error) {
    console.error('❌ Error crítico ejecutando el motor del cron:', error);
  }
};

runEngine();