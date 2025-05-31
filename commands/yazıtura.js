const { Discord, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, InteractionType, PermissionsBitField, StringSelectMenuBuilder, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require ("discord.js")
const fs = require('fs');

module.exports = {
  name: 'yt',
  description: 'Yazı tura oynamanızı sağlar.',
  async execute(message, args) {
    const aydi = message.author.id;

    if (args.length !== 2) {
      message.reply('Komutu doğru kullanınız: .yt (y/t) (bahis)');
      return;
    }

    const command = args[0].toLowerCase();
    const bahis = parseFloat(args[1]);

    if (isNaN(bahis) || bahis <= 0) {
      message.reply('Geçerli bir bahis miktarı girmelisiniz.');
      return;
    }

    const raw = fs.readFileSync('./money.json');
    const paradata = JSON.parse(raw);

    if (!(aydi in paradata)) {
      paradata[aydi] = { money: 0 };
    }

    if (paradata[aydi].money < bahis) {
      message.reply('Yeterli paranız yok.');
      return;
    }

    const hobala = Math.random() < 0.5 ? 'y' : 't';
    const seçim = command;

    let sonucusalla = `Sonuç **${hobala === 'y' ? 'Yazı' : 'Tura'}** `;
    if (hobala === seçim) {
      paradata[aydi].money += bahis;
      sonucusalla += `Tebrikler, ${bahis} TL kazandınız.`;
    } else {
      paradata[aydi].money -= bahis;
      sonucusalla += `Malesef, ${bahis} TL kaybettiniz.`;
    }

    fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));

    message.channel.send('Yazı tura atılıyor...').then(async (msg) => {
      setTimeout(() => {
        msg.edit(`${message.author}, ${sonucusalla}`);
      }, 4000);
    });
  },
};
