const { Discord, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, InteractionType, PermissionsBitField, StringSelectMenuBuilder, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require ("discord.js")
const fs = require('fs');

module.exports = {
  name: 'gönder',
  description: 'Başka bir kullanıcıya para gönderirsiniz.',
  execute(message, args) {
    const senderId = message.author.id;
    const receiverId = message.mentions.users.first()?.id;

    if (!receiverId) {
      message.reply('Bir kullanıcı etiketlemelisiniz.');
      return;
    }

    if (senderId === receiverId) {
      message.reply('Kendinize para gönderemezsiniz.');
      return;
    }

    const amount = parseFloat(args[1]);

    if (isNaN(amount) || amount <= 0) {
      message.reply('Geçerli bir miktar girmelisiniz.');
      return;
    }

    const moneyraw = fs.readFileSync('./money.json');
    const paradata = JSON.parse(moneyraw);

    if (!(senderId in paradata) || paradata[senderId].money < amount) {
      message.reply('Yeterli paranız yok.');
      return;
    }

    paradata[senderId].money -= amount;
    if (!(receiverId in paradata)) {
      paradata[receiverId] = { money: amount };
    } else {
      paradata[receiverId].money += amount;
    }

    fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));

    const senderUsername = message.author.username;
    const receiverUsername = message.mentions.users.first()?.username;

    const embed = new EmbedBuilder()
      .setTitle('Para Gönderme')
      .setColor(15844367)
      .setDescription(`${senderUsername}, ${receiverUsername} kullanıcısına ${amount} TL gönderdi!`);

    message.channel.send({ embeds: [embed] });
  },
};
