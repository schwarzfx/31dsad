const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const checkBalance = require('../fonksiyonlar/checkBalance');
const config = require('../config.json');

module.exports = {
  name: 'bakiye',
  description: 'Paranızı gösterir.',
  execute(message, args) {
    const aydi = message.author.id;

    let paradata = {};
    try {
      if (fs.existsSync('./money.json')) {
        const raw = fs.readFileSync('./money.json');
        paradata = JSON.parse(raw);
      }
    } catch (error) {
      console.error('Error reading money.json:', error);
      return message.reply('Veritabanına erişilirken bir hata oluştu.');
    }

    if (!paradata[aydi]) {
      paradata[aydi] = { money: 0 };
      try {
        fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));
      } catch (error) {
        console.error('Error writing to money.json:', error);
        return message.reply('Veritabanı güncellenirken bir hata oluştu.');
      }
    }

    checkBalance(aydi);
    const bara = paradata[aydi].money;

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('Bakiye')
      .setDescription(`Hesabında **${bara} ${config.currencyName}** var.`)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};