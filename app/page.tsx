// app/page.tsx
import MatchCard from '@/app/components/MatchCard';
import { db } from '@/lib/db/client';

export default async function Home() {
  const fixtures = db.prepare('SELECT id FROM fixtures ORDER BY date ASC, id ASC').all() as { id: number }[];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-12" suppressHydrationWarning>
      <header className="mb-12 border-b border-zinc-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white flex flex-col md:flex-row gap-2">
            <span>DINO BET</span> 
            <span className="text-zinc-600">AI ENGINE</span>
          </h1>
        </div>
        <p className="font-mono text-zinc-500 mt-3 tracking-widest text-xs uppercase flex flex-wrap gap-4">
          <span>// Torneo: Mundial 2026</span>
          <span className="text-emerald-500/70">// Módulo de Valor Esperado (EV+) Activo</span>
        </p>
      </header>

      {fixtures.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fixtures.map((f) => (
            <MatchCard key={f.id} fixtureId={f.id} />
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border border-zinc-900 border-dashed">
          <p className="text-zinc-500 font-mono italic">No hay partidos cargados en la base de datos.</p>
        </div>
      )}

      <footer className="mt-24 border-t border-zinc-900 pt-8 text-center">
        <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.2em]">
          DinoPicks Analytics © 2026. Identificación de valor matemático.
        </p>
      </footer>
    </div>
  );
}