
import fs from 'fs';
import path from 'path';

/**
 * Applies quest or side quest outcomes to a player's campaign profile.
 * Can include death, resurrection, item use, or status/role changes.
 * 
 * @param {string} userId - Discord User ID
 * @param {string} questPath - e.g. "main/Execution Squad" or "side/Wounded Forest"
 * @param {Object} resultObj - { type: "main" | "side", outcomeKey: string }
 * @param {Function} postToDiscord - Optional function to send messages
 */
export function applyQuestResults(userId, questPath, resultObj, postToDiscord = () => {}) {
  const basePath = './';
  const campaignFile = path.join(basePath, 'campaign.json');
  const profileFile = path.join(basePath, 'campaignprofile.json');
  const questDataFile = path.join(basePath, 'quest_data.json');

  const campaignData = JSON.parse(fs.readFileSync(campaignFile, 'utf-8'));
  const profileData = JSON.parse(fs.readFileSync(profileFile, 'utf-8'));
  const questData = JSON.parse(fs.readFileSync(questDataFile, 'utf-8'));

  const player = profileData[userId];
  if (!player) return console.warn(`[⚠️] Player ${userId} not found.`);

  const [type, questName] = questPath.split('/');
  const questSection = type === 'side' ? questData.side_quests : questData.quests;
  const quest = questSection?.[questName];
  if (!quest) return console.warn(`[⚠️] Quest "${questName}" not found in ${type} quests.`);

  const outcome = quest?.outcomes?.[resultObj.outcomeKey];
  if (!outcome) return console.warn(`[⚠️] Outcome key "${resultObj.outcomeKey}" not found.`);

  // Handle DEATH
  if (outcome.death) {
    player.status = 'Dead';
    postToDiscord(`💀 <@${userId}> has perished during the "${questName}" quest.`);
  }

  // Handle RESURRECTION
  if (outcome.revive_target) {
    const targetId = outcome.revive_target;
    const target = profileData[targetId];
    if (target?.status === 'Dead') {
      // Look for resurrection item in user's inventory
      const item = player.items?.find(i => i.toLowerCase().includes('revive'));
      if (item) {
        target.status = 'Alive';
        player.items = player.items.filter(i => i !== item);
        postToDiscord(`✨ <@${userId}> used **${item}** to revive <@${targetId}>!`);
      }
    }
  }

  // Handle ghost post if the player is dead and tried to react
  if (player.status === 'Dead') {
    const ghostMessages = [
      "👻 Whispers echo in the arena…",
      "💨 The air turns cold as a name etches itself in blood...",
      "🩸 The ghosts cry out, thirsty for vengeance…"
    ];
    const message = ghostMessages[Math.floor(Math.random() * ghostMessages.length)];
    postToDiscord(message);
  }

  // Apply status effects
  if (outcome.status) {
    player.effects = player.effects || [];
    player.effects.push(outcome.status);
  }

  // Apply item rewards
  if (outcome.items) {
    player.items = player.items || [];
    for (const item of outcome.items) {
      if (!player.items.includes(item)) {
        player.items.push(item);
      }
    }
  }

  // Apply role/title updates
  if (outcome.title) {
    player.role = outcome.title;
  }

  // Save progress to profile
  fs.writeFileSync(profileFile, JSON.stringify(profileData, null, 2));
  console.log(`✅ Applied ${type} quest result for ${userId} → ${questName}`);
}
