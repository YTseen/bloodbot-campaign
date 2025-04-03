
import fs from 'fs';
import path from 'path';

/**
 * Initializes a new campaign instance.
 * Called via the /launchquest command.
 * 
 * @param {Object} client - The Discord client
 * @param {Object} channel - The Discord channel to post in
 * @param {string} themeName - The name of the quest theme to launch
 */
export async function launchCampaign(client, channel, themeName) {
  const campaignPath = path.join('./', 'campaign.json');
  const dataPath = path.join('./', 'quest_data.json');

  const questData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  if (!questData.quests?.[themeName]) {
    channel.send(`[⚠️] Theme "${themeName}" not found in quest_data.json.`);
    return;
  }

  // Initialize the campaign file
  const newCampaign = {
    theme: themeName,
    players: [],
    status: 'recruiting',
    messageId: null,
    step: 0,
    side_quests: [],
    progress_log: []
  };
  fs.writeFileSync(campaignPath, JSON.stringify(newCampaign, null, 2));

  const introText = questData.quests[themeName].intro || `A new campaign theme has begun: **${themeName}**! React to join.`

  const post = await channel.send({
    content: `🩸 **New Quest Launched:** ${themeName}

${introText}

React with ⚔️ to join. Max 5 players.`,
    fetchReply: true
  });

  const filter = (reaction, user) => reaction.emoji.name === '⚔️' && !user.bot;
  const collector = post.createReactionCollector({ filter, time: 3600000 }); // 1 hour to join

  const joined = new Set();

  collector.on('collect', (reaction, user) => {
    const campaignData = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));
    if (campaignData.players.length >= 5) return;

    if (!joined.has(user.id)) {
      campaignData.players.push({ id: user.id, status: 'Alive' });
      joined.add(user.id);
      fs.writeFileSync(campaignPath, JSON.stringify(campaignData, null, 2));
      channel.send(`✅ <@${user.id}> has joined the quest! (${campaignData.players.length}/5)`);

      if (campaignData.players.length === 5) {
        collector.stop();
        channel.send('🔒 Party is full. Quest begins Tuesday at 6PM SAST!');
      }
    }
  });

  collector.on('end', () => {
    const campaignData = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));
    campaignData.messageId = post.id;
    campaignData.status = 'locked';
    fs.writeFileSync(campaignPath, JSON.stringify(campaignData, null, 2));
  });
}
