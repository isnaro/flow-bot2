const { ApplicationCommandOptionType } = require("discord.js");
const fs = require('fs');
const path = require('path');

const logsFilePath = path.join(__dirname, 'modlogs.json');

function getLogs() {
  if (!fs.existsSync(logsFilePath)) {
    fs.writeFileSync(logsFilePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(logsFilePath));
}

function saveLogs(logs) {
  fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2));
}

function deleteLogAction(userId, actionIndex) {
  const logs = getLogs();
  if (logs[userId] && logs[userId][actionIndex]) {
    logs[userId].splice(actionIndex, 1);
    saveLogs(logs);
  }
}

module.exports = {
  name: "actiondel",
  description: "Delete a specific action from modlogs",
  category: "MODERATION",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<ID|@member> <action number>",
    minArgsCount: 2,
  },

  async messageRun(message, args) {
    const match = await message.client.resolveUsers(args[0], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const actionNumber = parseInt(args[1], 10);
    if (isNaN(actionNumber)) return message.safeReply(`Invalid action number: ${args[1]}`);

    deleteLogAction(target.id, actionNumber - 1); // Convert to 0-based index
    await message.safeReply(`Action #${actionNumber} for ${target.username} has been deleted.`);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    if (!target) return interaction.followUp(`No user found matching the provided user.`);

    const actionNumber = interaction.options.getInteger("number");
    if (isNaN(actionNumber)) return interaction.followUp(`Invalid action number: ${actionNumber}`);

    deleteLogAction(target.id, actionNumber - 1); // Convert to 0-based index
    await interaction.followUp(`Action #${actionNumber} for ${target.username} has been deleted.`);
  },

  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "number",
        description: "The action number to delete",
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
  },
};
