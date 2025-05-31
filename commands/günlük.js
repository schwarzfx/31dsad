const { Discord, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, InteractionType, PermissionsBitField, StringSelectMenuBuilder, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require ("discord.js")
const fs = require('fs');
const checkBalance = require("../fonksiyonlar/checkBalance");

const cooldowns = new Map();

module.exports = {
  name: 'günlük',
  description: 'Günlük ödülünüzü alırsınız. (Sadece 12 saatte bir)',
  execute(message, args) {
    const aydi = message.author.id;

    const moneyraw = fs.readFileSync('./money.json', "utf8");
    const paradata = JSON.parse(moneyraw);

    const zaman = Date.now();
    if (cooldowns.has(aydi)) {
      const son = cooldowns.get(aydi);
      const fark = zaman - son;
      const geçti = Math.floor(fark / (1000 * 60 * 60));

      if (geçti < 12) {
        const kaldı = 12 - geçti;
        message.reply(`12 saatlik cooldown süresi içerisindesiniz. Bir sonraki ödülü almak için ${kaldı} saat beklemelisiniz.`);
        return;
      }
    }

    const min = 500;
    const max = 1000;
    const miktar = Math.floor(Math.random() * (max - min + 1)) + min;

    checkBalance(aydi);
 
    paradata[aydi].money += miktar;

    fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));

    cooldowns.set(aydi, zaman);

    const embed = new EmbedBuilder()
      .setTitle('Günlük Ödül')
      .setColor(5763719)
      .setDescription(`${message.author.username}, günlük ödül olarak ${miktar} TL kazandınız!`);

    message.channel.send({ embeds: [embed] });
  },
};
