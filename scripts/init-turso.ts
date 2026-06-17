// scripts/init-turso.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const initTurso = async () => {
  console.log('🚀 Conectando a Turso y creando estructura de tablas...');
  
  try {
    // 1. Tabla de Equipos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY,
        name TEXT,
        code TEXT,
        fifa_ranking INTEGER,
        offense_rating REAL,
        defense_rating REAL
      )
    `);

    // 2. Tabla de Partidos (Fixtures)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fixtures (
        id INTEGER PRIMARY KEY,
        home_team_id INTEGER,
        away_team_id INTEGER,
        date TEXT,
        status TEXT,
        stage TEXT,
        home_score INTEGER,
        away_score INTEGER,
        ai_processed INTEGER DEFAULT 0
      )
    `);

    // 3. Tabla de Predicciones
    await db.execute(`
      CREATE TABLE IF NOT EXISTS predictions (
        fixture_id INTEGER PRIMARY KEY,
        home_win_prob REAL,
        draw_prob REAL,
        away_win_prob REAL,
        over_2_5_prob REAL,
        btts_prob REAL,
        top_scores TEXT
      )
    `);

    console.log('✅ Base de datos en Turso lista para recibir datos.');
  } catch (error) {
    console.error('❌ Error creando las tablas:', error);
  }
};

initTurso();