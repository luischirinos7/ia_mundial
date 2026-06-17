// scripts/sync-all.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db } from '../lib/db/client';
import { fetchFootballData } from '../lib/data/api';

// Base de datos ELO real aproximada (World Football Elo Ratings)
const realEloRatings: Record<string, number> = {
  'argentina': 2140, 'france': 2110, 'spain': 2040, 'brazil': 2020, 
  'england': 2000, 'portugal': 2000, 'netherlands': 1980, 'germany': 1960, 
  'italy': 1950, 'uruguay': 1930, 'colombia': 1920, 'croatia': 1900, 
  'belgium': 1890, 'japan': 1780, 'mexico': 1800, 'usa': 1780, 
  'morocco': 1770, 'senegal': 1750, 'switzerland': 1740, 'norway': 1730, 
  'ecuador': 1730, 'czechia': 1720, 'scotland': 1700, 'panama': 1650, 
  'algeria': 1640, 'south africa': 1600, 'iraq': 1600, 'jordan': 1580,
  'ghana': 1550, 'congo dr': 1520, 'curacao': 1450, 'curaçao': 1450
};

const getRealisticRatings = (name: string) => {
  const normalName = name.toLowerCase();
  
  const elo = realEloRatings[normalName] || 1500;
  const variance = () => (Math.random() * 0.04) - 0.02;
  
  const offense = Math.max(0.5, 1.35 + ((elo - 1500) / 250)) + variance();
  const defense = Math.max(0.4, 1.0 - ((elo - 1500) / 350)) + variance();
  
  const ranking = elo > 2000 ? Math.floor(Math.random() * 5) + 1 
                : elo > 1800 ? Math.floor(Math.random() * 15) + 6
                : Math.floor(Math.random() * 50) + 22;

  return { offense, defense, ranking };
};

const syncAll = async () => {
  console.log('🔄 Sincronizando cartelera inicial con Turso (Motor ELO)...');
  try {
    const teamsData = await fetchFootballData('/competitions/WC/teams');
    
    // Inyectando equipos uno por uno en Turso
    for (const t of teamsData.teams) {
      const r = getRealisticRatings(t.name);
      await db.execute({
        sql: `INSERT OR IGNORE INTO teams (id, name, code, fifa_ranking, offense_rating, defense_rating) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [t.id, t.name, t.tla || 'N/A', r.ranking, r.offense, r.defense]
      });
    }

    const matchesData = await fetchFootballData('/competitions/WC/matches');
    
    // Obtener equipos existentes para validar
    const existingTeamsRes = await db.execute('SELECT id FROM teams');
    const allowedIds = new Set(existingTeamsRes.rows.map((t: any) => t.id));

    // Inyectando partidos en Turso
    for (const m of matchesData.matches) {
      if (allowedIds.has(m.homeTeam?.id) && allowedIds.has(m.awayTeam?.id)) {
        const isFinished = m.status === 'FINISHED';
        await db.execute({
          sql: `INSERT INTO fixtures (id, home_team_id, away_team_id, date, status, stage, home_score, away_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET 
                  status = excluded.status, 
                  home_score = excluded.home_score, 
                  away_score = excluded.away_score`,
          args: [
            m.id, m.homeTeam.id, m.awayTeam.id, m.utcDate, m.status, m.stage, 
            isFinished ? m.score?.fullTime?.home : null, 
            isFinished ? m.score?.fullTime?.away : null
          ]
        });
      }
    }
    console.log('✅ Base de datos ELO inyectada correctamente en la nube.');
  } catch (e) { 
    console.error('Error crítico conectando a Turso:', e); 
  }
};

syncAll();