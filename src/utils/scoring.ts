import type { Vote, Player, Drawing, RoundResult } from '../types';

export function calculateResults(
  players: Player[],
  drawings: Drawing[],
  votes: Vote[]
): RoundResult[] {
  const voteCounts: Record<string, number> = {};
  players.forEach(p => { voteCounts[p.uid] = 0; });
  votes.forEach(v => {
    voteCounts[v.targetUid] = (voteCounts[v.targetUid] || 0) + 1;
  });

  const results: RoundResult[] = players
    .filter(p => p.role === 'drawer')
    .map(p => {
      const drawing = drawings.find(d => d.uid === p.uid);
      return {
        uid: p.uid,
        displayName: p.displayName,
        imageUrl: drawing?.imageUrl || '',
        votes: voteCounts[p.uid] || 0,
        rank: 0,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}

export function getLastPlace(results: RoundResult[]): string | null {
  if (results.length === 0) return null;
  return results[results.length - 1].uid;
}

export function getWinner(results: RoundResult[]): string | null {
  if (results.length === 0) return null;
  return results[0].uid;
}
