const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const checkBalance = require('../fonksiyonlar/checkBalance');
const config = require('../config.json');


const MONEY_FILE = './money.json';
const MARKET_FILE = './market.json';

const DEFAULT_MONEY = { money: 0 };
const DEFAULT_INVENTORY = [];


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

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
}

function initializeUserData(paradata, marketData, userId) {
  if (!paradata[userId]) {
    paradata[userId] = DEFAULT_MONEY;
  }
  if (!marketData.inventories[userId]) {
    marketData.inventories[userId] = DEFAULT_INVENTORY;
  }
  return { paradata, marketData };
}


function createMarketEmbed(items, page, itemsPerPage) {
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = items.slice(start, end);

  return new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('Market')
    .setDescription('Mevcut ürünler:')
    .addFields(
      pageItems.map(item => ({
        name: `${item.name} (ID: ${item.id})`,
        value: `Fiyat: ${item.price} ${config.currencyName}`,
        inline: true,
      }))
    )
    .setFooter({ text: `Sayfa ${page + 1}/${Math.ceil(items.length / itemsPerPage)}` })
    .setTimestamp();
}

function createButtons(page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('Önceki')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Sonraki')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages - 1)
  );
}

module.exports = {
  name: 'market',
  description: 'Marketten ürün al veya sat.',
  execute(message, args) {
    const userId = message.author.id;

    
    let paradata = readJsonFile(MONEY_FILE);
    let marketData = readJsonFile(MARKET_FILE, { items: [], inventories: {} });

    
    const { paradata: updatedParadata, marketData: updatedMarketData } = initializeUserData(paradata, marketData, userId);
    paradata = updatedParadata;
    marketData = updatedMarketData;

    
    if (!writeJsonFile(MONEY_FILE, paradata) || !writeJsonFile(MARKET_FILE, marketData)) {
      return message.reply('Veritabanı güncellenirken bir hata oluştu.');
    }

    if (args[0] && args[0].toLowerCase() === 'al') {

      const itemId = args[1];
      if (!itemId) {
        return message.reply('Lütfen bir ürün ID’si belirtin. Örnek: `!market al kılıç`');
      }

      const item = marketData.items.find(i => i.id.toLowerCase() === itemId.toLowerCase());
      if (!item) {
        return message.reply('Bu ID’ye sahip bir ürün bulunamadı.');
      }

      checkBalance(userId);
      const userBalance = paradata[userId].money;

      if (userBalance < item.price) {
        return message.reply(`Yetersiz bakiye! ${item.name} almak için ${item.price} ${config.currencyName} gerekiyor, ama sende sadece ${userBalance} ${config.currencyName} var.`);
      }

      
      paradata[userId].money -= item.price;
      const ownerId = config.ownerId;
      if (!paradata[ownerId]) {
        paradata[ownerId] = DEFAULT_MONEY;
      }
      paradata[ownerId].money += item.price;

   
      marketData.inventories[userId].push({ ...item, ownerId });

  
      if (!writeJsonFile(MONEY_FILE, paradata) || !writeJsonFile(MARKET_FILE, marketData)) {
        return message.reply('İşlem kaydedilirken bir hata oluştu.');
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Satın Alma Başarılı')
        .setDescription(`**${item.name}** ürününü ${item.price} ${config.currencyName} karşılığında satın aldın! <@${ownerId}> kullanıcısına ${item.price} ${config.currencyName} ödendi.`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (args[0] && args[0].toLowerCase() === 'sat') {
      
      const itemId = args[1];
      if (!itemId) {
        return message.reply('Lütfen bir ürün ID’si belirtin. Örnek: `!market sat kılıç`');
      }

      const userInventory = marketData.inventories[userId];
      const inventoryItemIndex = userInventory.findIndex(i => i.id.toLowerCase() === itemId.toLowerCase());

      if (inventoryItemIndex === -1) {
        return message.reply(`Envanterinde ${itemId} bulunmuyor.`);
      }

      const item = userInventory[inventoryItemIndex];
      userInventory.splice(inventoryItemIndex, 1);
      paradata[userId].money += item.price;

    
      if (!writeJsonFile(MONEY_FILE, paradata) || !writeJsonFile(MARKET_FILE, marketData)) {
        return message.reply('İşlem kaydedilirken bir hata oluştu.');
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Satış Başarılı')
        .setDescription(`**${item.name}** ürününü ${item.price} ${config.currencyName} karşılığında sattın!`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

  
    const itemsPerPage = 5;
    let page = 0;
    const totalPages = Math.ceil(marketData.items.length / itemsPerPage);

    if (!marketData.items.length) {
      return message.reply('Markette ürün bulunmuyor.');
    }

    message.reply({ embeds: [createMarketEmbed(marketData.items, page, itemsPerPage)], components: [createButtons(page, totalPages)] }).then(sentMessage => {
      const collector = sentMessage.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: 'Bu butonları sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
        }

        if (interaction.customId === 'prev' && page > 0) {
          page--;
        } else if (interaction.customId === 'next' && page < totalPages - 1) {
          page++;
        }

        await interaction.update({ embeds: [createMarketEmbed(marketData.items, page, itemsPerPage)], components: [createButtons(page, totalPages)] });
      });

      collector.on('end', () => {
        sentMessage.edit({ components: [] }).catch(() => {});
      });
    });
  },
};