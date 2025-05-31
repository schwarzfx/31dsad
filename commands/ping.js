const { Discord, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, InteractionType, PermissionsBitField, StringSelectMenuBuilder, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require ("discord.js")
module.exports = {
  name: 'ping',
  description: 'pingi gösterir.',
  async execute(message, args, client) {
    const startTime = Date.now();
    const sentMessage = await message.reply('Bakıyorum...');
    const endTime = Date.now();
    const ping = endTime - startTime;

    sentMessage.edit(`Bot gecikmem: ${ping}ms, API gecikmem: ${client.ws.ping}ms`);
  },
};
