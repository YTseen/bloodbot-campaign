
import fs from 'fs';
import path from 'path';

/**
 * Determines a player's quest performance using stats + random chance.
 * 
 * @param {string} userId - Discord User ID
 * @returns {{ midweek: "High" | "Low", final: "Success" | "Failure" }}
 */
export function getPerformance(userId) {
  const historyPath = path.join('../bo1-bloodbath-bbb', 'history.json');
  let history;

  try {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch (err) {
    console.error('[❌] Could not read history.json:', err);
    return {
      midweek: Math.random() > 0.5 ? "High" : "Low",
      final: Math.random() > 0.5 ? "Success" : "Failure"
    };
  }

  const stats = history.player_stats?.[userId];
  let performanceScore = 0;

  if (stats) {
    const { wins = 0, losses = 0 } = stats;
    const total = wins + losses;
    if (total > 0) {
      performanceScore = (wins / total) * 100;
    }
  }

  // Adjust scores based on basic thresholds
  const midweek = performanceScore >= 50 || Math.random() > 0.6 ? "High" : "Low";
  const final = performanceScore >= 40 || Math.random() > 0.5 ? "Success" : "Failure";

  return { midweek, final };
}
