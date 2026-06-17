// app/components/MatchCard.tsx
import { getMatchPredictions } from '@/lib/db/actions';
import MatchMarkets from './MatchMarkets';

export default async function MatchCard({ fixtureId }: { fixtureId: number }) {
  const data = await getMatchPredictions(fixtureId);
  
  if (!data.fixture || !data.prediction) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-none font-mono text-zinc-700 italic">
        // Esperando proyecciones de IA...
      </div>
    );
  }

  const { fixture, prediction } = data;
  const isFinished = fixture.status === 'FINISHED';

  // Lógica de validación de la IA (O1X2)
  let iaHit = false;
  let statusText = 'IA: PROYECTANDO';
  let badgeColor = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
  let dotColor = 'bg-amber-500';

  if (isFinished && fixture.home_score !== null && fixture.away_score !== null) {
    let realOutcome = 'E';
    if (fixture.home_score > fixture.away_score) realOutcome = 'L';
    if (fixture.home_score < fixture.away_score) realOutcome = 'V';

    const maxP = Math.max(prediction.home_win_prob, prediction.draw_prob, prediction.away_win_prob);
    let iaChoice = 'E';
    if (maxP === prediction.home_win_prob) iaChoice = 'L';
    else if (maxP === prediction.draw_prob) iaChoice = 'E';
    else iaChoice = 'V';

    iaHit = iaChoice === realOutcome;
    statusText = iaHit ? 'IA: ACERTADO O1X2' : 'IA: FALLADO O1X2';
    badgeColor = iaHit 
      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' 
      : 'text-red-400 border-red-500/20 bg-red-500/5';
    dotColor = iaHit ? 'bg-emerald-500' : 'bg-red-500';
  }

  // --- LÓGICA BLINDADA: EXTRACCIÓN DEL MARCADOR EXACTO ---
  let exactScore = "0-0";
  try {
    if ((prediction as any).top_scores) {
      const parsed = JSON.parse((prediction as any).top_scores);
      let highestProb = -1;
      
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          let prob = 0;
          let scoreStr = "";

          // Si el JSON viene con goles separados: { home: 2, away: 1, prob: 0.15 }
          if (item.home !== undefined && item.away !== undefined) {
            scoreStr = `${item.home}-${item.away}`;
            prob = Number(item.prob || item.probability || 0);
          } 
          // Si viene como string directo: { score: "2-1", prob: 0.15 }
          else if (item.score !== undefined) {
            scoreStr = String(item.score);
            prob = Number(item.prob || item.probability || 0);
          }
          // Si viene la llave como marcador: { "2-1": 0.15 }
          else {
            const dashKey = Object.keys(item).find(k => k.includes('-'));
            if (dashKey) {
              scoreStr = dashKey;
              prob = Number(item[dashKey]);
            }
          }

          if (scoreStr && prob > highestProb) {
            highestProb = prob;
            exactScore = scoreStr;
          }
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Si el objeto principal trae los scores como llaves
        for (const [key, val] of Object.entries(parsed)) {
          if (key.includes('-') && Number(val) > highestProb) {
            highestProb = Number(val);
            exactScore = key;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error al decodificar el marcador", e);
  }

  return (
    <div className={`bg-zinc-950 border ${isFinished ? (iaHit ? 'border-emerald-950' : 'border-red-950') : 'border-zinc-800'} p-5 rounded-none font-mono tracking-tight transition-colors flex flex-col h-full`}>
      
      {/* HEADER DE ESTADO */}
      <div className="flex justify-between items-center mb-6">
        <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border ${badgeColor}`}>
          {statusText}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${!isFinished && 'animate-pulse'}`} />
        </div>
      </div>
      
      {/* NOMBRES Y RESULTADO REAL */}
      <div className="flex justify-between items-center py-2 border-b border-zinc-900 pb-5 mb-4">
        <div className="flex flex-col flex-1 w-1/3">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter truncate" title={fixture.home_name}>{fixture.home_name}</h2>
          <span className="text-zinc-600 text-[9px] uppercase mt-0.5 font-bold">Local</span>
        </div>

        <div className="flex items-center justify-center px-2 w-1/3">
          {isFinished ? (
            <div className="flex items-center gap-2 text-2xl font-black text-white bg-zinc-900 px-3 py-1 border border-zinc-800 tabular-nums shadow-inner">
              <span>{fixture.home_score}</span>
              <span className="text-zinc-600 text-sm font-normal text-center">:</span>
              <span>{fixture.away_score}</span>
            </div>
          ) : (
            <span className="text-lg font-black text-zinc-800 italic">VS</span>
          )}
        </div>

        <div className="flex flex-col flex-1 text-right w-1/3">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter truncate" title={fixture.away_name}>{fixture.away_name}</h2>
          <span className="text-zinc-600 text-[9px] uppercase mt-0.5 font-bold">Visitante</span>
        </div>
      </div>

      {/* EL MARCADOR EXACTO MÁS PROBABLE (FRANCOTIRADOR) */}
      <div className="flex justify-center mb-5">
        <div className="px-4 py-1.5 bg-zinc-900/80 border border-emerald-900/30 rounded flex items-center gap-3">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Score IA:</span>
          <span className="text-lg font-black text-emerald-400 tabular-nums tracking-widest">{exactScore}</span>
        </div>
      </div>

      {/* PANEL DE APUESTAS INTERACTIVO */}
      <MatchMarkets 
        prediction={prediction} 
        homeName={fixture.home_name} 
        awayName={fixture.away_name} 
      />

    </div>
  );
}