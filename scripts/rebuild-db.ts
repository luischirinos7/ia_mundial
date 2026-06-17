// scripts/rebuild-db.ts
import { db } from '../lib/db/client';

console.log('🏗️ Reconstruyendo estructura de tablas...');

db.transaction(() => {
  // Eliminamos todo para asegurar que la estructura esté limpia
  db.prepare('DROP TABLE IF EXISTS predictions').run();
  db.prepare('DROP TABLE IF EXISTS fixtures').run();
  db.prepare('DROP TABLE IF EXISTS teams').run();

  // Creamos equipos
  db.prepare(`
    CREATE TABLE teams (
      id INTEGER PRIMARY KEY,
      name TEXT,
      code TEXT,
      fifa_ranking INTEGER,
      offense_rating REAL,
      defense_rating REAL
    )
  `).run();

  // Creamos partidos con las columnas que faltaban
  db.prepare(`
    CREATE TABLE fixtures (
      id INTEGER PRIMARY KEY,
      home_team_id INTEGER,
      away_team_id INTEGER,
      date TEXT,
      status TEXT,
      stage TEXT,
      home_score INTEGER DEFAULT NULL,
      away_score INTEGER DEFAULT NULL,
      ai_processed INTEGER DEFAULT 0,
      FOREIGN KEY(home_team_id) REFERENCES teams(id),
      FOREIGN KEY(away_team_id) REFERENCES teams(id)
    )
  `).run();

  // Creamos predicciones
  db.prepare(`
    CREATE TABLE predictions (
      fixture_id INTEGER PRIMARY KEY,
      home_win_prob REAL,
      draw_prob REAL,
      away_win_prob REAL,
      over_2_5_prob REAL,
      btts_prob REAL,
      top_scores TEXT,
      FOREIGN KEY(fixture_id) REFERENCES fixtures(id)
    )
  `).run();
})();

console.log('✅ Tablas reconstruidas con todas las columnas necesarias.');