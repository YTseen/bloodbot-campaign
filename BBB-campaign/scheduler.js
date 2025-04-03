
import fs from 'fs';
import path from 'path';

function getCurrentTimeInfo() {
  const now = new Date();
  const weekday = now.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Johannesburg' });
  const hour = now.getHours();
  const minute = now.getMinutes();
  const iso = now.toISOString();
  return { now, weekday, hour, minute, iso };
}

function getCampaignData() {
  const campaignPath = path.join('./', 'campaign.json');
  if (!fs.existsSync(campaignPath)) return null;
  return JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));
}

function saveCampaignData(data) {
  const campaignPath = path.join('./', 'campaign.json');
  fs.writeFileSync(campaignPath, JSON.stringify(data, null, 2));
}

export function checkAndScheduleCampaign(postHandlers) {
  const { now, weekday, hour } = getCurrentTimeInfo();
  const campaign = getCampaignData();
  if (!campaign || campaign.status !== 'locked') return;

  // Add week tracking if missing
  if (!campaign.week) campaign.week = 1;
  if (!campaign.phase) campaign.phase = 'intro';
  if (!campaign.lastPost) campaign.lastPost = '';

  const postedToday = campaign.lastPost?.startsWith(now.toISOString().slice(0, 10));
  const log = (msg) => console.log(`[📅 Scheduler] ${msg}`);

  // Phase logic
  if (campaign.phase === 'intro' && weekday === 'Tuesday' && hour >= 18 && !postedToday) {
    postHandlers.postIntro();
    campaign.phase = 'progress_1';
    campaign.lastPost = now.toISOString();
    saveCampaignData(campaign);
    return;
  }

  if (campaign.phase.startsWith('progress')) {
    const current = parseInt(campaign.phase.split('_')[1]);
    if (['Thursday', 'Friday', 'Saturday'].includes(weekday) && hour >= 15 && !postedToday) {
      postHandlers.postProgress(current);
      if (current < 5) {
        campaign.phase = `progress_${current + 1}`;
      } else {
        campaign.phase = 'finale';
      }
      campaign.lastPost = now.toISOString();
      saveCampaignData(campaign);
      return;
    }
  }

  if (campaign.phase === 'finale' && weekday === 'Sunday' && hour >= 18 && !postedToday) {
    postHandlers.postFinale();
    campaign.week += 1;
    campaign.phase = 'done';
    campaign.lastPost = now.toISOString();
    saveCampaignData(campaign);
    return;
  }

  log('No updates needed at this time.');
}
