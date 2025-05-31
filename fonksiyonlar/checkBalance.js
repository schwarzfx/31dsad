const fs = require('fs');

function checkBalance(userId) {
  let paradata = {};
  try {
    if (fs.existsSync('./money.json')) {
      const raw = fs.readFileSync('./money.json');
      paradata = JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error reading money.json:', error);
    paradata = {};
  }

  if (!paradata[userId]) {
    paradata[userId] = { money: 0 };
    try {
      fs.writeFileSync('./money.json', JSON.stringify(paradata, null, 2));
    } catch (error) {
      console.error('Error writing to money.json:', error);
    }
  }

  return paradata[userId].money;
}

module.exports = checkBalance;