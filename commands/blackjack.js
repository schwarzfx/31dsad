const { Discord, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, InteractionType, PermissionsBitField, StringSelectMenuBuilder, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require ("discord.js")
const fs = require('fs');

function kartçek() {
  const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  return cards[Math.floor(Math.random() * cards.length)];
}
function hesapla(hand) {
  let value = 0;
  let hasAce = false;

  for (const card of hand) {
    if (card === 'A') {
      hasAce = true;
      value += 11;
    } else if (['K', 'Q', 'J'].includes(card)) {
      value += 10;
    } else {
      value += parseInt(card);
    }
  }

  if (hasAce && value > 21) {
    value -= 10;
  }

  return value;
}
const emojiler = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K',
  'A': 'A',
};

module.exports = {
  name: 'bj',
  description: 'Blackjack oynamanızı sağlar.',
  aliases: ['bj', '21'],
  async execute(message, args) {
    const aydi = message.author.id;

    if (args.length !== 1) {
      const embed = new EmbedBuilder()
        .setColor(9807270)
        .setDescription('Komutu doğru kullanınız: .blackjack (bahis)');
      message.reply({ embeds: [embed] });
      return;
    }

    const bahis = parseFloat(args[0]);
    if (isNaN(bahis) || bahis <= 0) {
      const embed = new EmbedBuilder()
        .setColor(9807270)
        .setDescription('Geçerli bir bahis miktarı girmelisiniz.');
      message.reply({ embeds: [embed] });
      return;
    }

    const raw = fs.readFileSync('./money.json');
    const paradata = JSON.parse(raw);

    if (!(aydi in paradata)) {
      const embed = new EmbedBuilder()
        .setColor(9807270)
        .setDescription('Henüz bir hesabınız yok.');
      message.reply({ embeds: [embed] });
      return;
    }

    if (paradata[aydi].money < bahis) {
      const embed = new EmbedBuilder()
        .setColor(9807270)
        .setDescription('Yeterli paranız yok.');
      message.reply({ embeds: [embed] });
      return;
    }

    const oyuncu = [kartçek(), kartçek()];
    const krupiyerkart = kartçek();
    const krupiyer = [krupiyerkart];
    let oyuncudeğer = hesapla(oyuncu);
    let botdeğer = hesapla(krupiyer);
    const oyuncutext = oyuncu.map(card => emojiler[card]).join(' ');
    const krupiyertext = krupiyer.map(card => emojiler[card]).join(' ');

    const embed = new EmbedBuilder()
      .setColor(9807270)
      .setTitle('---BlackJack---')
      .addFields(
        { name: 'Oyuncunun Kartları', value: ` ${oyuncutext}\nToplam: ${oyuncudeğer}`, inline: true },
        { name: 'Krupiyenin Kartları', value: ` ${krupiyertext}\nToplam: ?`, inline: true }
      );

    const oyuncumeşaz = await message.reply({ embeds: [embed] });
    await oyuncumeşaz.react('🃏');
    await oyuncumeşaz.react('🛑');

    const filter = (reaction, user) => ['🃏', '🛑'].includes(reaction.emoji.name) && user.id === aydi;
    const collector = oyuncumeşaz.createReactionCollector({ filter, time: 30000 });

    collector.on('collect', async (reaction) => {
      if (reaction.emoji.name === '🃏') {
        const newCard = kartçek();
        oyuncu.push(newCard);
        oyuncudeğer = hesapla(oyuncu);

        if (oyuncudeğer > 21) {
          collector.stop('burst');
        } else {
          const embed = new EmbedBuilder()
            .setColor(9807270)
            .setTitle('---BlackJack---')
            .addFields(
              { name: 'Oyuncunun Kartları', value: ` ${oyuncu.map(card => emojiler[card]).join(' ')}\nToplam: ${oyuncudeğer}`, inline: true },
              { name: 'Krupiyenin Kartları', value: ` ${krupiyertext}\nToplam: ?`, inline: true }
            );
          await oyuncumeşaz.edit({ embeds: [embed] });
        }
      } else if (reaction.emoji.name === '🛑') {
        collector.stop('stand');
      }
    });

    collector.on('end', async (collected, reason) => {
      while (botdeğer < 17) {
        const newCard = kartçek();
        krupiyer.push(newCard);
        botdeğer = hesapla(krupiyer);
      }

      const botsonuç = `Krupiye kartları: ${krupiyer.join(', ')} (Toplam: ${botdeğer})`;
      const oyuncusonuç = `Oyuncu kartları: ${oyuncu.join(', ')} (Toplam: ${oyuncudeğer})`;
      const resultEmbed = new EmbedBuilder().setTitle('Blackjack Sonuçları');

      if (reason === 'burst') {
        resultEmbed.setColor(15548997).setDescription(`El patladı! Kaybettiniz.\n\n${botsonuç}\n\n${oyuncusonuç}`);
        paradata[aydi].money -= bahis;
      } else if (reason === 'stand') {
        if (botdeğer > 21 || botdeğer < oyuncudeğer) {
          resultEmbed.setColor(5763719).setDescription(`Kazandınız!\n\n${botsonuç}\n\n${oyuncusonuç}`);
          paradata[aydi].money += bahis;
        } else if (botdeğer > oyuncudeğer) {
          resultEmbed.setColor(15548997).setDescription(`Kaybettiniz.\n\n${botsonuç}\n\n${oyuncusonuç}`);
          paradata[aydi].money -= bahis;
        } else {
          resultEmbed.setColor(15105570).setDescription(`Berabere.\n\n${botsonuç}\n\n${oyuncusonuç}`);
        }
      }

      fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));

      message.channel.send({ embeds: [resultEmbed] });
    });
  },
};
