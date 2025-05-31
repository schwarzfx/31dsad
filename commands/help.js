const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const fs = require('fs');
const config = require('../config.json');


const USERS_FILE = './users.json';


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


const userCommands = [
  { name: 'help', description: 'Komut listesini gösterir.' },
  { name: 'gunluk', description: 'Günlük ödül alır.' },
  { name: 'yazitura', description: 'Yazı-tura oyunu oynar.' },
  { name: 'gonder', description: 'Başka bir kullanıcıya para gönderir.' },
];

const economyCommands = [
  { name: 'bakiye', description: 'Paranızı gösterir.' },
  { name: 'blackjack', description: 'Blackjack oyunu oynar.' },
  { name: 'envanter', description: 'Envanterindeki ürünleri gösterir.' },
  { name: 'market', description: 'Marketten ürün al veya sat.' },
  { name: 'para-ekle', description: 'Kullanıcıya para ekler (admin komutu).' },
  { name: 'siralama', description: 'En zengin kullanıcıları sıralar.' },
  { name: 'slot', description: 'Slot oyunu oynar.' },
];


function createHelpEmbed(category) {
  let embed;
  switch (category) {
    case 'user':
      embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('Kullanıcı Komutları')
        .setDescription('Mevcut komutlar:')
        .addFields(
          userCommands.map(cmd => ({
            name: `!${cmd.name}`,
            value: cmd.description,
            inline: true,
          }))
        )
        .setTimestamp();
      break;
    case 'economy':
      embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('Ekonomi Komutları')
        .setDescription('Mevcut komutlar:')
        .addFields(
          economyCommands.map(cmd => ({
            name: `!${cmd.name}`,
            value: cmd.description,
            inline: true,
          }))
        )
        .setTimestamp();
      break;
    case 'home':
      embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('Ana Sayfa')
        .setDescription(
          'Hoş geldiniz! Bu bot, eğlenceli ekonomi ve oyun komutları sunar.\n\n' +
          'Aşağıdaki menüden komut kategorilerini seçerek başlayabilirsiniz:\n' +
          '- **Kullanıcı Komutları**: Genel komutlar.\n' +
          '- **Ekonomi Komutları**: Para ve oyunla ilgili komutlar.'
        )
        .setTimestamp();
      break;
    default:
      embed = createHelpEmbed('home');  
  }
  return embed;
}


function createSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('Bir kategori seçin...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Ana Sayfa')
          .setDescription('Botun ana sayfasına dön.')
          .setValue('home'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Kullanıcı Komutları')
          .setDescription('Genel kullanıcı komutlarını gösterir.')
          .setValue('user'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Ekonomi Komutları')
          .setDescription('Ekonomi ile ilgili komutları gösterir.')
          .setValue('economy')
      )
  );
}

module.exports = {
  name: 'help',
  description: 'Komut listesini gösterir.',
  execute(message, args) {
    const userId = message.author.id;

 
    let usersData = readJsonFile(USERS_FILE);

  
    if (usersData[userId] === undefined) {
     
      const rulesEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Kurallar')
        .setDescription(
          'Botu kullanmadan önce kuralları kabul etmelisiniz:\n\n' +
          '1. **Spam yapmayın!**\n' +
          '2. **Saygılı olun!**\n\n' +
          'Bu kuralları kabul ediyor musunuz?'
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('accept_rules')
          .setLabel('Kabul Et')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('reject_rules')
          .setLabel('Reddet')
          .setStyle(ButtonStyle.Danger)
      );

      message.reply({ embeds: [rulesEmbed], components: [row], ephemeral: true }).then(sentMessage => {
        const collector = sentMessage.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async interaction => {
          if (interaction.user.id !== userId) {
            return interaction.reply({ content: 'Bu butonları sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
          }

          usersData[userId] = interaction.customId === 'accept_rules';
          if (!writeJsonFile(USERS_FILE, usersData)) {
            return interaction.reply({ content: 'Veritabanı güncellenirken bir hata oluştu.', ephemeral: true });
          }

          if (interaction.customId === 'accept_rules') {
            await interaction.update({
              embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle('Başarılı').setDescription('Kuralları kabul ettiniz! Artık komutları kullanabilirsiniz.')],
              components: [],
              ephemeral: true,
            });
            message.reply({ embeds: [createHelpEmbed('home')], components: [createSelectMenu()] });
          } else {
            await interaction.update({
              embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('Reddedildi').setDescription('Kuralları reddettiniz. Komutları kullanamazsınız.')],
              components: [],
              ephemeral: true,
            });
          }
        });

        collector.on('end', () => {
          if (usersData[userId] === undefined) {
            usersData[userId] = false;
            writeJsonFile(USERS_FILE, usersData);
            sentMessage.edit({
              embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('Süre Doldu').setDescription('Kuralları kabul etmediniz. Komutları kullanamazsınız.')],
              components: [],
            }).catch(() => {});
          }
        });
      });
      return;
    }

     
    if (!usersData[userId]) {
      return message.reply('Kuralları kabul etmediniz. Komutları kullanabilmek için `!yardim` veya `!help` komutunu çalıştırıp kuralları kabul edin.');
    }

   
    message.reply({ embeds: [createHelpEmbed('home')], components: [createSelectMenu()] }).then(sentMessage => {
      const collector = sentMessage.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: 'Bu menüyü sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
        }

        const category = interaction.values[0];
        await interaction.update({ embeds: [createHelpEmbed(category)], components: [createSelectMenu()] });
      });

      collector.on('end', () => {
        sentMessage.edit({ components: [] }).catch(() => {});
      });
    });
  },
};