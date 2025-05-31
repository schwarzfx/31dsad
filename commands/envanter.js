const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');


const MARKET_FILE = './market.json';


function readJsonFile(filePath, defaultData = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath));
    }
    return defaultData;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

module.exports = {
  name: 'envanter',
  description: 'Envanterindeki ürünleri gösterir.',
  execute(message, args) {
    const userId = message.author.id;


    const marketData = readJsonFile(MARKET_FILE, { items: [], inventories: {} });

    if (!marketData.inventories[userId]) {
      marketData.inventories[userId] = [];
    }

    const userInventory = marketData.inventories[userId];

    if (!userInventory.length) {
      return message.reply('Envanterin boş.');
    }

  
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('Envanter')
      .setDescription('Sahip olduğun ürünler:')
      .addFields(
        userInventory.map(item => ({
          name: `${item.name} (ID: ${item.id})`,
          value: `Fiyat: ${item.price} ${config.currencyName}`,
          inline: true,
        }))
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};