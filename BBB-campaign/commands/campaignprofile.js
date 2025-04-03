
import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('campaignprofile')
  .setDescription('View your campaign journey and current status.');

export async function execute(interaction) {
  const userId = interaction.user.id;
  const campaignData = JSON.parse(fs.readFileSync('campaign.json', 'utf8'));

  const entry = campaignData.players?.[userId];

  if (!entry) {
    await interaction.reply({ content: '❌ You are not part of the campaign yet. Use `/join` to enter.', flags: 64 });
    return;
  }

  const profile = `🎭 **Title:** ${entry.title}
📍 **Status:** ${entry.status}
🎒 **Items:** ${entry.items.length > 0 ? entry.items.join(', ') : 'None'}
📖 **Lore Flags:** ${entry.lore_flags.length > 0 ? entry.lore_flags.join(', ') : 'None'}`;

  await interaction.reply({ content: profile, flags: 64 });
}
