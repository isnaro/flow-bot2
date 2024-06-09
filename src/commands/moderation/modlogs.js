const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

const logsFilePath = path.join(__dirname, 'modlogs.json');

// Utility functions for logging
function getLogs() {
  if (!fs.existsSync(logsFilePath)) {
    fs.writeFileSync(logsFilePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(logsFilePath));
}

function saveLogs(logs) {
  fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2));
}

function logAction(userId, action) {
  const logs = getLogs();
  if (!logs[userId]) {
    logs[userId] = [];
  }
  logs[userId].push(action);
  saveLogs(logs);
}

// Main command module
module.exports = {
  name: "modlogs",
  description: "Displays moderation logs for a user",
  category: "MODERATION",
  command: {
    enabled: true,
    usage: "<ID|@member> [page]",
    minArgsCount: 1,
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
        name: "page",
        description: "The page number of logs to display",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    try {
      if (!hasRequiredRole(message.member)) {
        return message.safeReply("You do not have the required role to use this command.");
      }

      const target = await message.guild.members.fetch(args[0]).catch(() => null);
      if (!target) return message.safeReply(`No user found matching ${args[0]}`);

      const page = args[1] ? parseInt(args[1]) - 1 : 0;
      const logs = getLogs()[target.user.id] || [];
      await sendModlogEmbed(message, target.user, logs, page);
    } catch (error) {
      console.error("Error in messageRun:", error);
      message.safeReply("An error occurred while running this command.");
    }
  },

  async interactionRun(interaction) {
    try {
      if (!hasRequiredRole(interaction.member)) {
        return interaction.followUp("You do not have the required role to use this command.");
      }

      const user = interaction.options.getUser("user");
      const page = interaction.options.getInteger("page") ? interaction.options.getInteger("page") - 1 : 0;
      const target = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!target) return interaction.followUp(`No user found matching ${user.id}`);

      const logs = getLogs()[target.user.id] || [];
      await sendModlogEmbed(interaction, target.user, logs, page);
    } catch (error) {
      console.error("Error in interactionRun:", error);
      interaction.followUp("An error occurred while running this command.");
    }
  },
};

function hasRequiredRole(member) {
  const requiredRoles = ["1226166868952350721", "1226167494226608198"];
  return requiredRoles.some(role => member.roles.cache.has(role));
}

async function sendModlogEmbed(context, user, logs, pageIndex) {
  try {
    if (logs.length === 0) {
      return context.reply(`No logs found for ${user.tag}`);
    }

    const itemsPerPage = 5;
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    if (pageIndex >= totalPages) pageIndex = totalPages - 1;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Moderation Logs for ${user.tag}`, iconURL: user.displayAvatarURL() })
      .setColor("#FF0000")
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages}` });

    const start = pageIndex * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = logs.slice(start, end);

    pageItems.forEach((log, index) => {
      embed.addFields(
        { name: `Action ${start + index + 1}`, value: log.type, inline: true },
        { name: "Reason", value: log.reason, inline: true },
        { name: "Date", value: new Date(log.date).toLocaleString(), inline: true },
        { name: "Issuer", value: log.issuer, inline: true },
        log.duration ? { name: "Duration", value: log.duration, inline: true } : {}
      );
    });

    await context.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in sendModlogEmbed:", error);
    console.log("Logs causing error:", logs);
    context.reply("An error occurred while generating the modlog embed.");
  }
}
