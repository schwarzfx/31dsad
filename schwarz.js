const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const { prefix, token } = require('./config.json');


const client = new Client({
  intents: Object.values(GatewayIntentBits).reduce((acc, intent) => acc | intent, 0),
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
  shards: 'auto',
});

client.commands = new Map();


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

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.name && command.description) {
    client.commands.set(command.name, command);
  }
  console.log(`[ LOADED ]: ${command.name}`);
}

client.once('ready', () => {
  console.log(`[ ONLINE ] - ${client.user.tag}`);
  console.log('[ OWNER ] - schwarz');
});


client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;


  if (commandName !== 'help') {
    const usersData = readJsonFile('./users.json');
    if (!usersData[message.author.id]) {
      return message.reply('Kuralları kabul etmediniz. Komutları kullanabilmek için `.help` komutunu çalıştırıp kuralları kabul edin.');
    }
  }

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error('Command error:', error);
    message.reply({
      content: ':x: Üzgünüm bir hata ile karşılaştım. Sorunun devam ederse destek sunucusuna katılabilirsiniz. https://discord.gg/nexshop',
    });
  }
});


client.login(token);