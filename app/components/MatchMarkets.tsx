// app/components/MatchMarkets.tsx
"use client";

import { useState } from 'react';

// Fórmula financiera para Cuota Justa
const getFairOdd = (prob: number) => {
  if (prob <= 0) return '0.00';
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
  // Estados iniciales de los tres menús desplegables
  const [market1, setMarket1] = useState('home_win');
  const [market2, setMarket2] = useState('over_2_5');
  const [market3, setMarket3] = useState('btts_yes');

  // Tarjeta 1: Mercado 1X2 Principal
  const m1Data = {
    'home_win': { label: `Gana ${homeName}`, prob: prediction.home_win_prob },
    'draw': { label: 'Empate', prob: prediction.draw_prob },
    'away_win': { label: `Gana ${awayName}`, prob: prediction.away_win_prob }
  };

  // Algoritmo de curva para proyectar líneas de goles secundarias basado en el Over 2.5
  const pO25 = prediction.over_2_5_prob;
  const pO05 = Math.min(0.98, pO25 + 0.38); // El over 0.5 casi siempre es altísimo
  const pO15 = Math.min(0.88, pO25 + 0.22);
  const pO35 = Math.max(0.08, pO25 - 0.24); // El over 3.5 siempre es riesgoso

  // Tarjeta 2: Mercado Total de Goles (Líneas Asiáticas y Clásicas)
  const m2Data = {
    'over_0_5': { label: 'Over 0.5 Goles', prob: pO05 },
    'under_0_5': { label: 'Under 0.5 Goles', prob: 1 - pO05 },
    'over_1_5': { label: 'Over 1.5 Goles', prob: pO15 },
    'under_1_5': { label: 'Under 1.5 Goles', prob: 1 - pO15 },
    'over_2_5': { label: 'Over 2.5 Goles', prob: pO25 },
    'under_2_5': { label: 'Under 2.5 Goles', prob: 1 - pO25 },
    'over_3_5': { label: 'Over 3.5 Goles', prob: pO35 },
    'under_3_5': { label: 'Under 3.5 Goles', prob: 1 - pO35 }
  };

  // Tarjeta 3: Ambos Anotan (BTTS)
  const m3Data = {
    'btts_yes': { label: 'Ambos Anotan (Sí)', prob: prediction.btts_prob },
    'btts_no': { label: 'Ambos Anotan (No)', prob: 1 - prediction.btts_prob }
  };

  const currM1 = m1Data[market1 as keyof typeof m1Data];
  const currM2 = m2Data[market2 as keyof typeof m2Data];
  const currM3 = m3Data[market3 as keyof typeof m3Data];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-center mt-auto">
      
      {/* TARJETA 1: 1X2 */}
      <div className="bg-zinc-900/40 p-2 border border-zinc-900 flex flex-col justify-between">
        <select 
          value={market1} 
          onChange={(e) => setMarket1(e.target.value)}
          className="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-800 p-1.5 mb-3 uppercase tracking-wider outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <option value="home_win">1 - Local</option>
          <option value="draw">X - Empate</option>
          <option value="away_win">2 - Visitante</option>
        </select>
        <div>
          <p className="text-xl font-black text-white">{(currM1.prob * 100).toFixed(0)}%</p>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/50 flex justify-between px-1">
          <p className="text-[9px] text-zinc-500 uppercase">Cuota Justa</p>
          <p className="text-[10px] text-emerald-400 font-black">@{getFairOdd(currM1.prob)}</p>
        </div>
      </div>

      {/* TARJETA 2: LÍNEAS DE GOLES */}
      <div className="bg-zinc-900/40 p-2 border border-zinc-900 flex flex-col justify-between">
        <select 
          value={market2} 
          onChange={(e) => setMarket2(e.target.value)}
          className="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-800 p-1.5 mb-3 uppercase tracking-wider outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <optgroup label="Línea 0.5">
            <option value="over_0_5">Over 0.5</option>
            <option value="under_0_5">Under 0.5</option>
          </optgroup>
          <optgroup label="Línea 1.5">
            <option value="over_1_5">Over 1.5</option>
            <option value="under_1_5">Under 1.5</option>
          </optgroup>
          <optgroup label="Línea 2.5 (Principal)">
            <option value="over_2_5">Over 2.5</option>
            <option value="under_2_5">Under 2.5</option>
          </optgroup>
          <optgroup label="Línea 3.5">
            <option value="over_3_5">Over 3.5</option>
            <option value="under_3_5">Under 3.5</option>
          </optgroup>
        </select>
        <div>
          <p className="text-xl font-black text-white">{(currM2.prob * 100).toFixed(0)}%</p>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/50 flex justify-between px-1">
          <p className="text-[9px] text-zinc-500 uppercase">Cuota Justa</p>
          <p className="text-[10px] text-emerald-400 font-black">@{getFairOdd(currM2.prob)}</p>
        </div>
      </div>

      {/* TARJETA 3: AMBOS ANOTAN */}
      <div className="bg-zinc-900/40 p-2 border border-zinc-900 flex flex-col justify-between">
        <select 
          value={market3} 
          onChange={(e) => setMarket3(e.target.value)}
          className="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-800 p-1.5 mb-3 uppercase tracking-wider outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <option value="btts_yes">BTTS: Sí</option>
          <option value="btts_no">BTTS: No</option>
        </select>
        <div>
          <p className="text-xl font-black text-white">{(currM3.prob * 100).toFixed(0)}%</p>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/50 flex justify-between px-1">
          <p className="text-[9px] text-zinc-500 uppercase">Cuota Justa</p>
          <p className="text-[10px] text-emerald-400 font-black">@{getFairOdd(currM3.prob)}</p>
        </div>
      </div>

    </div>
  );
}