const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

const MONEY_FILE = './money.json';

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
  name: 'sıralamak',
  description: 'En zengin kullanıcıları sıralar.',
  async execute(message, args, client) {

    const paradata = readJsonFile(MONEY_FILE);

    const users = Object.entries(paradata)
      .map(([userId, data]) => ({ userId, money: data.money || 0 }))
      .sort((a, b) => b.money - a.money);

    if (!users.length) {
      return message.reply('Hiçbir kullanıcının bakiyesi bulunmuyor.');
    }

    const usersPerPage = 10;
    let page = 0;
    const totalPages = Math.ceil(users.length / usersPerPage);

 
    const generateEmbed = async (page) => {
      const start = page * usersPerPage;
      const end = start + usersPerPage;
      const pageUsers = users.slice(start, end);

      const fields = await Promise.all(
        pageUsers.map(async (user, index) => {
          let username = user.userId;
          try {
            const fetchedUser = await client.users.fetch(user.userId);
            username = fetchedUser.username;
          } catch (error) {
            console.warn(`Failed to fetch user ${user.userId}:`, error);
          }
          return {
            name: `#${start + index + 1} - ${username}`,
            value: `${user.money} ${config.currencyName}`,
            inline: false,
          };
        })
      );

      return new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('Bakiye Sıralaması')
        .setDescription('En zengin kullanıcılar:')
        .addFields(fields)
        .setFooter({ text: `Sayfa ${page + 1}/${totalPages}` })
        .setTimestamp();
    };


    const generateButtons = (page) => {
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
    };

  
    const sentMessage = await message.reply({
      embeds: [await generateEmbed(page)],
      components: [generateButtons(page)],
    });


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

      await interaction.update({
        embeds: [await generateEmbed(page)],
        components: [generateButtons(page)],
      });
    });

    collector.on('end', () => {
      sentMessage.edit({ components: [] }).catch(() => {});
    });
  },
};