const { Client, Intents, MessageAttachment } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_HISTORY
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Replace with your log channel ID
const logChannelId = '1244104024626823248';

client.on('channelDelete', async (channel) => {
  if (channel.type !== 'GUILD_TEXT') return;

  const logChannel = await client.channels.fetch(logChannelId);
  if (!logChannel) return console.error('Log channel not found');

  try {
    const messages = await fetchAllMessages(channel);
    const htmlContent = createHtmlLog(messages, channel.name);
    const filePath = saveHtmlToFile(htmlContent, channel.name);
    const attachment = new MessageAttachment(filePath);

    await logChannel.send({ content: `Channel "${channel.name}" was deleted. Here is the log:`, files: [attachment] });
  } catch (error) {
    console.error('Error logging channel:', error);
  }
});

async function fetchAllMessages(channel) {
  let messages = [];
  let lastId = null;
  let options = { limit: 100 };

  while (true) {
    if (lastId) {
      options.before = lastId;
    }

    const fetched = await channel.messages.fetch(options);
    messages = messages.concat(Array.from(fetched.values()));
    lastId = fetched.last().id;

    if (fetched.size !== 100) {
      break;
    }
  }

  return messages;
}

function createHtmlLog(messages, channelName) {
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log of #${channelName}</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .message { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc; }
    .author { font-weight: bold; }
    .timestamp { color: #999; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Log of #${channelName}</h1>`;

  messages.reverse().forEach(message => {
    htmlContent += `
    <div class="message">
      <div class="author">${message.author.tag}</div>
      <div class="timestamp">${new Date(message.createdTimestamp).toLocaleString()}</div>
      <div class="content">${message.content}</div>
    </div>`;
  });

  htmlContent += `
</body>
</html>`;

  return htmlContent;
}

function saveHtmlToFile(htmlContent, channelName) {
  const fileName = `log-${channelName}-${Date.now()}.html`;
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, htmlContent, 'utf8');
  return filePath;
}

module.exports = client;
