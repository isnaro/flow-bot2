const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
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

function logAction(userId, action) {
  const logs = getLogs();
  if (!logs[userId]) {
    logs[userId] = [];
  }
  logs[userId].push(action);
  saveLogs(logs);
}

function clearLogs(userId) {
  const logs = getLogs();
  if (logs[userId]) {
    delete logs[userId];
    saveLogs(logs);
  }
}

module.exports = {
  name: "warn",
  description: "Warns the specified member",
  category: "MODERATION",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<ID|@member> [reason]",
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
        name: "reason",
        description: "Reason for warning",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = await message.client.resolveUsers(args[0], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const reason = args.slice(1).join(" ") || "No reason provided";

    const response = await warn(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const response = await warn(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function warn(issuer, target, reason) {
  const logChannelId = "1225439125776367697"; // Channel to send the embed

  try {
    // Send DM to the user
    const dmMessage = `## ⚠️ You have been warned in ${issuer.guild.name} for: ***${reason}*** ##

### Please follow the server rules <#1200477076113850468> to avoid further actions. ###`;

    try {
      await target.send(dmMessage);
    } catch (err) {
      console.error(`Failed to send DM to ${target.username}:`, err);
    }

    // Log the warning action
    logAction(target.id, {
      type: 'warn',
      reason,
      date: new Date().toISOString(),
      issuer: issuer.user.tag,
      issuerId: issuer.user.id,
    });

    // Create and send the embed
    const logChannel = issuer.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: `Moderation - Warn`, iconURL: issuer.user.displayAvatarURL() })
        .setColor("#FFA500")
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "Member", value: `${target.tag} [${target.id}]`, inline: false },
          { name: "Reason", value: reason || "No reason provided", inline: false }
        )
        .setFooter({
          text: `Warned by ${issuer.user.tag} [${issuer.user.id}]`,
          iconURL: issuer.user.displayAvatarURL(),
        })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    return `${target.username} has been warned.`;
  } catch (error) {
    console.error("Error warning user:", error);
    return "Failed to warn the user. Please try again later.";
  }
}

// Command for clearing warnings
module.exports.clearWarns = {
  name: "warns",
  description: "Clear warnings for a user",
  category: "MODERATION",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "clear <ID|@member>",
    minArgsCount: 2,
  },

  async messageRun(message, args) {
    if (args[0].toLowerCase() !== "clear") return message.safeReply(`Invalid command usage.`);

    const match = await message.client.resolveUsers(args[1], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[1]}`);

    clearLogs(target.id);
    await message.safeReply(`${target.username}'s warnings have been cleared.`);
  },
};
