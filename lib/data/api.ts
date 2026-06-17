// lib/data/api.ts

export const fetchFootballData = async (endpoint: string) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    console.error('Error: FOOTBALL_DATA_API_KEY no definida.');
    return null;
  }

  // La URL base para football-data.org (versión 4)
  const response = await fetch(`https://api.football-data.org/v4${endpoint}`, {
    headers: {
      'X-Auth-Token': apiKey,
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Error API: ${response.status}`);
  }

  return response.json();
};