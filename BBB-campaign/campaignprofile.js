
import fs from 'fs';
import path from 'path';

/**
 * Returns a nicely formatted string of a player's campaign profile.
 * Used for the /campaignprofile command.
 *
 * @param {string} userId - Discord User ID
 * @returns {string}
 */
export function getCampaignProfile(userId) {
  const profilePath = path.join('./', 'campaignprofile.json');

  const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  const player = profiles[userId];

  if (!player) return '[❌] No campaign profile found for this user.';

  const title = player.role || 'Unranked';
  const status = player.status || 'Alive';
  const effects = player.effects?.length ? player.effects.join(', ') : 'None';
  const items = player.items?.length
    ? player.items.map(item => `• ${item}`).join('\n')
    : 'None';

  return `🩸 **Campaign Profile: <@${userId}>**
**Title:** ${title}
**Status:** ${status}
**Effects:** ${effects}
**Inventory:**
${items}`;
}
