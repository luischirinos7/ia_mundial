// scripts/cron.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db } from '../lib/db/client';
import { calculateMatchProbabilities } from '../lib/model/poisson';

const LEARNING_RATE = 0.1;

const runEngine = () => {
  console.log('🧠 Iniciando ciclo de aprendizaje automático...');
  
  const finished = db.prepare(`
    SELECT f.*, h.offense_rating as h_off, h.defense_rating as h_def, a.offense_rating as a_off, a.defense_rating as a_def
    FROM fixtures f JOIN teams h ON f.home_team_id = h.id JOIN teams a ON f.away_team_id = a.id
    WHERE f.status = 'FINISHED' AND f.ai_processed = 0
  `).all() as any[];

  db.transaction(() => {
    finished.forEach(m => {
      const h_err = m.home_score - (m.h_off * m.a_def);
      const a_err = m.away_score - (m.a_off * m.h_def);
      db.prepare('UPDATE teams SET offense_rating = ?, defense_rating = ? WHERE id = ?').run(Math.max(0.5, m.h_off + h_err * LEARNING_RATE), Math.max(0.3, m.h_def + a_err * LEARNING_RATE), m.home_team_id);
      db.prepare('UPDATE teams SET offense_rating = ?, defense_rating = ? WHERE id = ?').run(Math.max(0.5, m.a_off + a_err * LEARNING_RATE), Math.max(0.3, m.a_def + h_err * LEARNING_RATE), m.away_team_id);
      db.prepare('UPDATE fixtures SET ai_processed = 1 WHERE id = ?').run(m.id);
    });
  })();

  // CORRECCIÓN: Solo borramos las predicciones de los partidos que NO han terminado
  db.prepare(`DELETE FROM predictions WHERE fixture_id IN (SELECT id FROM fixtures WHERE status != 'FINISHED')`).run();
  
  const insertPred = db.prepare('INSERT INTO predictions (fixture_id, home_win_prob, draw_prob, away_win_prob, over_2_5_prob, btts_prob, top_scores) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  // CORRECCIÓN: Calculamos predicciones para juegos futuros, o para aquellos que terminaron pero nunca se les calculó una
  const fixtures = db.prepare(`
    SELECT f.id, h.offense_rating as h_off, h.defense_rating as h_def, a.offense_rating as a_off, a.defense_rating as a_def 
    FROM fixtures f 
    JOIN teams h ON f.home_team_id = h.id 
    JOIN teams a ON f.away_team_id = a.id 
    LEFT JOIN predictions p ON f.id = p.fixture_id
    WHERE f.status != 'FINISHED' OR p.fixture_id IS NULL
  `).all() as any[];
  
  db.transaction(() => {
    fixtures.forEach(f => {
      const stats = calculateMatchProbabilities(f.h_off * f.a_def, f.a_off * f.h_def);
      insertPred.run(f.id, stats.homeWin, stats.draw, stats.awayWin, stats.over2_5, stats.bttsYes, JSON.stringify(stats.exactScores));
    });
  })();
  console.log('✅ Predicciones y aprendizaje actualizados.');
};

runEngine();