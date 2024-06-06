const { timeoutTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const ems = require("enhanced-ms");
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

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "timeout",
  description: "Timeouts the specified member",
  category: "MODERATION",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  command: {
    enabled: true,
    aliases: ["tmt"],
    usage: "<ID|@member> <duration> [reason]",
    minArgsCount: 2,
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
        name: "duration",
        description: "The time to timeout the member for",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for timeout",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    // Parse time
    const duration = ems(args[1]);
    if (!duration) return message.safeReply("Please provide a valid duration. Example: 1d/1h/1m/1s");

    const reason = args.slice(2).join(" ").trim() || "No reason provided";
    const response = await timeout(message.member, target, duration, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");

    // Parse time
    const duration = interaction.options.getString("duration");
    const ms = ems(duration);
    if (!ms) return interaction.followUp("Please provide a valid duration. Example: 1d/1h/1m/1s");

    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id);

    const response = await timeout(interaction.member, target, ms, reason);
    await interaction.followUp(response);
  },
};

async function timeout(issuer, target, ms, reason) {
  if (isNaN(ms)) return "Please provide a valid duration. Example: 1d/1h/1m/1s";

  const endTime = new Date(Date.now() + ms);
  const endTimeString = endTime.toLocaleString('en-GB', { timeZone: 'Africa/Algiers' });

  try {
    await target.send(
      `## ⏰⏰ You have been timed out in FLOW for: ***${reason}*** ##

### The timeout duration is: ${ems(ms, { long: true })}. It will be automatically removed on: ${endTimeString}. Please follow the server rules <#1200477076113850468> to avoid further actions. ###

### In case you believe the timeout was unfair, you can appeal your timeout here: [FLOW Appeal](https://discord.gg/YuJbSBxbrX) ###`
    );
  } catch (err) {
    console.error(`Failed to send DM to ${target.user.username}:`, err);
  }

  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

  const response = await timeoutTarget(issuer, target, ms, reason);
  if (typeof response === "boolean") {
    // Log the timeout action
    logAction(target.id, {
      type: 'timeout',
      reason,
      duration: ems(ms, { long: true }),
      date: new Date().toISOString(),
      issuer: issuer.user.tag,
    });

    return `${target.user.username} is timed out until ${endTimeString}!`;
  }

  switch (response) {
    case "BOT_PERM":
      return `I do not have permission to timeout ${target.user.username}`;
    case "MEMBER_PERM":
      return `You do not have permission to timeout ${target.user.username}`;
    case "ALREADY_TIMEOUT":
      return `${target.user.username} is already timed out!`;
    default:
      return `Failed to timeout ${target.user.username}`;
  }
}
