// app/page.tsx
import { db } from '@/lib/db/client';
import MatchCard from './components/MatchCard';

export default async function Home() {
  // Una sola consulta a la nube, no 20 por separado
  const result = await db.execute(`
    SELECT f.*, h.name as home_name, a.name as away_name, p.*
    FROM fixtures f 
    JOIN teams h ON f.home_team_id = h.id 
    JOIN teams a ON f.away_team_id = a.id
    LEFT JOIN predictions p ON f.id = p.fixture_id
    ORDER BY f.date ASC
  `);

  const fixtures = result.rows;

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fixtures.map((match: any) => (
          <MatchCard key={match.id} data={match} />
        ))}
      </div>
    </div>
  );
}