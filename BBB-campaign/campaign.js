
import fs from 'fs';
import path from 'path';

/**
 * Loads a quest phase from the data and formats it into a postable message.
 * Used by the bot to display intros, progress updates, and finales.
 *
 * @param {string} phase - e.g., "intro", "progress_1", "progress_2", "finale"
 * @param {string} userId - Discord User ID (optional, for personal progress)
 * @param {boolean} isSideQuest - Whether this is a side quest or not
 * @returns {string} The formatted quest message
 */
export function getQuestPhaseMessage(phase, userId = null, isSideQuest = false) {
  const dataPath = path.join('./', 'quest_data.json');
  const campaignPath = path.join('./', 'campaign.json');
  const profilePath = path.join('./', 'campaignprofile.json');

  const questData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const campaign = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));
  const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));

  const currentTheme = campaign.theme;
  const allPhases = isSideQuest ? questData.side_quests : questData.quests;
  const quest = allPhases[currentTheme];

  if (!quest) return '[⚠️] Quest not found for current theme.';

  if (userId && quest.progress_reports?.[userId]?.[phase]) {
    return quest.progress_reports[userId][phase];
  }

  if (!userId && quest[phase]) {
    return quest[phase];
  }

  return '[⚠️] Phase not found or no custom message for this user.';
}
