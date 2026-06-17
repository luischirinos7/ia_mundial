// lib/db/actions.ts
'use server'
import { db } from './client';

export interface Fixture {
  id: number;
  home_name: string;
  away_name: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

export interface Prediction {
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  over_2_5_prob: number;
}

export async function getMatchPredictions(fixtureId: number) {
  // 1. Buscamos los datos del partido cruzando los nombres de los equipos
  const fixture = db.prepare(`
    SELECT f.*, h.name as home_name, a.name as away_name 
    FROM fixtures f
    JOIN teams h ON f.home_team_id = h.id
    JOIN teams a ON f.away_team_id = a.id
    WHERE f.id = ?
  `).get(fixtureId) as Fixture | undefined;

  // 2. Buscamos la predicción directa (quitamos el ORDER BY timestamp)
  const prediction = db.prepare(`
    SELECT * FROM predictions 
    WHERE fixture_id = ?
  `).get(fixtureId) as Prediction | undefined;

  return { fixture, prediction };
}