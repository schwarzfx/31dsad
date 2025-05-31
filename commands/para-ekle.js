const { Discord, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, InteractionType, PermissionsBitField, StringSelectMenuBuilder, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require ("discord.js")
const fs = require('fs');

module.exports = {
  name: 'pe',
  description: 'para ekleme komutu (kurucu)',
  execute(message, args) {
    if (message.author.id !== '1358144844027138152') {
      message.reply('Bu komutu kullanma izniniz yok.');
      return;
    }

    if (args.length !== 2 || isNaN(args[1])) {
      message.reply('Komutu doğru kullanınız: .pe <kullanıcı_adı> <miktar>');
      return;
    }

    const eleman = message.mentions.users.first();
    if (!eleman) {
      message.reply('Bir kullanıcı etiketlemelisiniz.');
      return;
    }

    const miktar = parseFloat(args[1]);
    if (miktar <= 0 || isNaN(miktar)) {
      message.reply('Geçerli bir miktar giriniz.');
      return;
    }

    const raw = fs.readFileSync('./money.json');
    const paradata = JSON.parse(raw);

    if (!(eleman.id in paradata)) {
      paradata[eleman.id] = { money: 0 };
    }

    paradata[eleman.id].money += miktar;

    fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));

    message.reply(`${eleman.tag} kullanıcısının hesabına ${miktar} TL eklendi.`);
  },
};
