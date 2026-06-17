import { db } from '../lib/db/client';

const initSchema = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT, flag TEXT,
      group_letter TEXT, fifa_ranking INTEGER,
      offense_rating REAL DEFAULT 1.0, defense_rating REAL DEFAULT 1.0
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS fixtures (
      id INTEGER PRIMARY KEY, home_team_id INTEGER, away_team_id INTEGER,
      date TEXT, status TEXT, stage TEXT, home_score INTEGER, away_score INTEGER,
      FOREIGN KEY(home_team_id) REFERENCES teams(id),
      FOREIGN KEY(away_team_id) REFERENCES teams(id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, fixture_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, home_win_prob REAL,
      draw_prob REAL, away_win_prob REAL, over_2_5_prob REAL,
      btts_prob REAL, top_scores TEXT,
      FOREIGN KEY(fixture_id) REFERENCES fixtures(id)
    )
  `).run();

  console.log('Estructura de SQLite creada exitosamente en mundial2026.db');
};

initSchema();