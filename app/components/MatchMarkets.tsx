// app/components/MatchMarkets.tsx
"use client";

import { useState } from 'react';

const getFairOdd = (prob: number | null | undefined) => {
  if (!prob || prob <= 0) return '0.00';
  return (1 / prob).toFixed(2);
};

export default function MatchMarkets({ 
  prediction, 
  homeName, 
  awayName 
}: { 
  prediction: any, 
  homeName: string, 
  awayName: string 
}) {
  const [market1, setMarket1] = useState('home_win');
  const [market2, setMarket2] = useState('over_2_5');
  const [market3, setMarket3] = useState('btts_yes');

  // Aseguramos valores por defecto de 0 si la IA aún no ha procesado nada
  const pHome = prediction?.home_win_prob ?? 0;
  const pDraw = prediction?.draw_prob ?? 0;
  const pAway = prediction?.away_win_prob ?? 0;
  const pO25 = prediction?.over_2_5_prob ?? 0;
  const pBtts = prediction?.btts_prob ?? 0;

  // Algoritmo de aproximación estadística seguro
  const pO05 = Math.min(0.98, pO25 + 0.38);
  const pO15 = Math.min(0.88, pO25 + 0.22);
  const pO35 = Math.max(0.08, pO25 - 0.24);

  const m1Data: any = {
    'home_win': { label: `Gana ${homeName}`, prob: pHome },
    'draw': { label: 'Empate', prob: pDraw },
    'away_win': { label: `Gana ${awayName}`, prob: pAway }
  };

  const m2Data: any = {
    'over_0_5': { label: 'Over 0.5 Goles', prob: pO05 },
    'under_0_5': { label: 'Under 0.5 Goles', prob: 1 - pO05 },
    'over_1_5': { label: 'Over 1.5 Goles', prob: pO15 },
    'under_1_5': { label: 'Under 1.5 Goles', prob: 1 - pO15 },
    'over_2_5': { label: 'Over 2.5 Goles', prob: pO25 },
    'under_2_5': { label: 'Under 2.5 Goles', prob: 1 - pO25 },
    'over_3_5': { label: 'Over 3.5 Goles', prob: pO35 },
    'under_3_5': { label: 'Under 3.5 Goles', prob: 1 - pO35 }
  };

  const m3Data: any = {
    'btts_yes': { label: 'Ambos Anotan (Sí)', prob: pBtts },
    'btts_no': { label: 'Ambos Anotan (No)', prob: 1 - pBtts }
  };

  const currM1 = m1Data[market1];
  const currM2 = m2Data[market2];
  const currM3 = m3Data[market3];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-center mt-auto">
      {/* Tarjeta 1 */}
      <div className="bg-zinc-900/40 p-2 border border-zinc-900 flex flex-col justify-between">
        <select value={market1} onChange={(e) => setMarket1(e.target.value)} className="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-800 p-1 mb-2 uppercase cursor-pointer">
          <option value="home_win">1 - Local</option>
          <option value="draw">X - Empate</option>
          <option value="away_win">2 - Visitante</option>
        </select>
        <p className="text-xl font-black text-white">{(currM1.prob * 100).toFixed(0)}%</p>
        <p className="text-[10px] text-emerald-400 font-black mt-1">@{getFairOdd(currM1.prob)}</p>
      </div>

      {/* Tarjeta 2 */}
      <div className="bg-zinc-900/40 p-2 border border-zinc-900 flex flex-col justify-between">
        <select value={market2} onChange={(e) => setMarket2(e.target.value)} className="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-800 p-1 mb-2 uppercase cursor-pointer">
          <option value="over_0_5">Over 0.5</option>
          <option value="over_1_5">Over 1.5</option>
          <option value="over_2_5">Over 2.5</option>
          <option value="over_3_5">Over 3.5</option>
        </select>
        <p className="text-xl font-black text-white">{(currM2.prob * 100).toFixed(0)}%</p>
        <p className="text-[10px] text-emerald-400 font-black mt-1">@{getFairOdd(currM2.prob)}</p>
      </div>

      {/* Tarjeta 3 */}
      <div className="bg-zinc-900/40 p-2 border border-zinc-900 flex flex-col justify-between">
        <select value={market3} onChange={(e) => setMarket3(e.target.value)} className="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-800 p-1 mb-2 uppercase cursor-pointer">
          <option value="btts_yes">BTTS: Sí</option>
          <option value="btts_no">BTTS: No</option>
        </select>
        <p className="text-xl font-black text-white">{(currM3.prob * 100).toFixed(0)}%</p>
        <p className="text-[10px] text-emerald-400 font-black mt-1">@{getFairOdd(currM3.prob)}</p>
      </div>
    </div>
  );
}