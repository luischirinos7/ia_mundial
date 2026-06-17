// lib/model/poisson.ts

export type MatchProbabilities = {
  homeWin: number;
  draw: number;
  awayWin: number;
  over2_5: number;
  under2_5: number;
  bttsYes: number;
  bttsNo: number;
  exactScores: Array<{ home: number; away: number; probability: number }>;
};

// Función para calcular factorial
const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = n; i > 1; i -= 1) {
    result *= i;
  }
  return result;
};

// Distribución de Poisson: P(x) = (lambda^x * e^-lambda) / x!
export const poissonProbability = (lambda: number, x: number): number => {
  return (Math.pow(lambda, x) * Math.exp(-lambda)) / factorial(x);
};

export const calculateMatchProbabilities = (
  homeLambda: number,
  awayLambda: number,
  maxGoals: number = 5
): MatchProbabilities => {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over2_5 = 0;
  let bttsYes = 0;
  const exactScores = [];

  // Matriz de probabilidades de marcadores
  for (let i = 0; i <= maxGoals; i += 1) {
    for (let j = 0; j <= maxGoals; j += 1) {
      const prob = poissonProbability(homeLambda, i) * poissonProbability(awayLambda, j);

      exactScores.push({ home: i, away: j, probability: prob });

      if (i > j) homeWin += prob;
      if (i === j) draw += prob;
      if (i < j) awayWin += prob;

      if (i + j > 2.5) over2_5 += prob;
      if (i > 0 && j > 0) bttsYes += prob;
    }
  }

  // Ordenamos los marcadores exactos por probabilidad descendente
  exactScores.sort((a, b) => b.probability - a.probability);

  return {
    homeWin,
    draw,
    awayWin,
    over2_5,
    under2_5: 1 - over2_5,
    bttsYes,
    bttsNo: 1 - bttsYes,
    exactScores: exactScores.slice(0, 5),
  };
};