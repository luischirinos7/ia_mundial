// app/api/update/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { fetchFootballData } from '@/lib/data/api';
import { calculateMatchProbabilities } from '@/lib/model/poisson';

const LEARNING_RATE = 0.1;

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
  }

  try {
    console.log('🔄 Iniciando actualización en Turso (API + IA)...');

    // --- FASE 1: SINCRONIZACIÓN ---
    const teamsData = await fetchFootballData('/competitions/WC/teams');
    
    for (const t of teamsData.teams) {
      const r = getRealisticRatings(t.name);
      await db.execute({
        sql: `INSERT OR IGNORE INTO teams (id, name, code, fifa_ranking, offense_rating, defense_rating) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [t.id, t.name, t.tla || 'N/A', r.ranking, r.offense, r.defense]
      });
    }

    const matchesData = await fetchFootballData('/competitions/WC/matches');
    const existingTeamsRes = await db.execute('SELECT id FROM teams');
    const allowedIds = new Set(existingTeamsRes.rows.map((t: any) => t.id));

    for (const m of matchesData.matches) {
      if (allowedIds.has(m.homeTeam?.id) && allowedIds.has(m.awayTeam?.id)) {
        const isFinished = m.status === 'FINISHED';
        await db.execute({
          sql: `
            INSERT INTO fixtures (id, home_team_id, away_team_id, date, status, stage, home_score, away_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
              status = excluded.status, 
              home_score = excluded.home_score, 
              away_score = excluded.away_score
          `,
          args: [
            m.id, m.homeTeam.id, m.awayTeam.id, m.utcDate, m.status, m.stage,
            isFinished ? m.score?.fullTime?.home : null,
            isFinished ? m.score?.fullTime?.away : null
          ]
        });
      }
    }

    // --- FASE 2: APRENDIZAJE IA ---
    const finishedRes = await db.execute(`
      SELECT f.*, h.offense_rating as h_off, h.defense_rating as h_def, a.offense_rating as a_off, a.defense_rating as a_def
      FROM fixtures f JOIN teams h ON f.home_team_id = h.id JOIN teams a ON f.away_team_id = a.id
      WHERE f.status = 'FINISHED' AND f.ai_processed = 0
    `);

    for (const m of finishedRes.rows as any[]) {
      const h_err = m.home_score - (m.h_off * m.a_def);
      const a_err = m.away_score - (m.a_off * m.h_def);
      
      await db.execute({
        sql: 'UPDATE teams SET offense_rating = ?, defense_rating = ? WHERE id = ?',
        args: [Math.max(0.5, m.h_off + h_err * LEARNING_RATE), Math.max(0.4, m.h_def + a_err * LEARNING_RATE), m.home_team_id]
      });
      await db.execute({
        sql: 'UPDATE teams SET offense_rating = ?, defense_rating = ? WHERE id = ?',
        args: [Math.max(0.5, m.a_off + a_err * LEARNING_RATE), Math.max(0.4, m.a_def + h_err * LEARNING_RATE), m.away_team_id]
      });
      await db.execute({ sql: 'UPDATE fixtures SET ai_processed = 1 WHERE id = ?', args: [m.id] });
    }

    // --- FASE 3: RECALCULANDO ---
    await db.execute(`DELETE FROM predictions WHERE fixture_id IN (SELECT id FROM fixtures WHERE status != 'FINISHED')`);
    
    const fixturesPendingRes = await db.execute(`
      SELECT f.id, h.offense_rating as h_off, h.defense_rating as h_def, a.offense_rating as a_off, a.defense_rating as a_def 
      FROM fixtures f 
      JOIN teams h ON f.home_team_id = h.id 
      JOIN teams a ON f.away_team_id = a.id 
      LEFT JOIN predictions p ON f.id = p.fixture_id
      WHERE p.fixture_id IS NULL
    `);

    for (const f of fixturesPendingRes.rows as any[]) {
      const stats = calculateMatchProbabilities(f.h_off * f.a_def, f.a_off * f.h_def);
      await db.execute({
        sql: `INSERT INTO predictions (fixture_id, home_win_prob, draw_prob, away_win_prob, over_2_5_prob, btts_prob, top_scores) 
              VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(fixture_id) DO NOTHING`,
        args: [f.id, stats.homeWin, stats.draw, stats.awayWin, stats.over2_5, stats.bttsYes, JSON.stringify(stats.exactScores)]
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Actualización completada! Partidos procesados: ${finishedRes.rows.length}. Proyecciones generadas: ${fixturesPendingRes.rows.length}.` 
    });

  } catch (error) {
    console.error('Error en motor Turso:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}