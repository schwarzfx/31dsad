const { Discord, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, InteractionType, PermissionsBitField, StringSelectMenuBuilder, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require ("discord.js")
const fs = require('fs');

module.exports = {
  name: 'slot',
  description: 'Slot oyunu oynarsınız.',
  async execute(message, args) {
    const aydi = message.author.id;
    if (args.length !== 1) {
      message.reply('Komutu doğru kullanınız: .slot (bahis)');
      return;
    }
    const bahis = parseFloat(args[0]);
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
  
    const slotdeğerler = ['🍒', '🍊', '🍋', '🍇', '🍉', '🍍', '🍓', '🍏'];
    const slots = [];
    let slotmesaj = await message.reply('Slot makinesi çalıştırıldı!');

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * slotdeğerler.length);
      slots.push(slotdeğerler[randomIndex]);
    }

    await slotmesaj.edit(`Slot makinesi çalışıyor.. - ${slots[0]}`);

    await new Promise(resolve => setTimeout(resolve, 2000));
    await slotmesaj.edit(`Slot makinesi çalışıyor.. - ${slots[0]} ${slots[1]}`);

    await new Promise(resolve => setTimeout(resolve, 2000));
    await slotmesaj.edit(`Slot makinesi çalışıyor.. ${slots[0]} ${slots[1]} ${slots[2]}`);

    const result = slots.join(' ');
    if (slots[0] === slots[1] && slots[1] === slots[2]) {
      paradata[aydi].money += bahis * 10;
      await slotmesaj.edit(`Slot makinesi sonuçlandı! ${result}\nTebrikler! ${bahis * 10} TL kazandınız.`);
    } else if (slots[0] === slots[1] || slots[1] === slots[2] || slots[0] === slots[2]) {
      paradata[aydi].money += bahis;  
      await slotmesaj.edit(`Slot makinesi sonuçlandı! ${result}\nTebrikler! ${bahis * 2} TL kazandınız.`);
    } else {
      paradata[aydi].money -= bahis;
      await slotmesaj.edit(`Slot makinesi sonuçlandı! ${result}\nÜzgünüm, ${bahis} TL kaybettiniz.`);
    }

    fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));
  },
};
