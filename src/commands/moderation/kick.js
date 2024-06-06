const { kickTarget } = require("@helpers/ModUtils");
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
  name: "kick",
  description: "Kicks the specified member",
  category: "MODERATION",
  botPermissions: ["KickMembers"],
  userPermissions: ["KickMembers"],
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
        description: "Reason for kick",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = args.slice(1).join(" ").trim() || "No reason provided";
    const response = await kick(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id);

    const response = await kick(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function kick(issuer, target, reason) {
  try {
    const dmMessage = `## ⚠️⚠️ You have been KICKED from FLOW for : ***${reason}*** ##

### Please follow the server rules <#1200477076113850468> to avoid further actions. ###

### You can rejoin the server using this link: [FLOW Server](https://discord.gg/aPHyTRU3aT) ###`;
    
    try {
      await target.send(dmMessage);
    } catch (err) {
      console.error(`Failed to send DM to ${target.user.username}:`, err);
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay

    const response = await kickTarget(issuer, target, reason);
    if (typeof response === "boolean") {
      logAction(target.user.id, {
        type: 'kick',
        reason,
        date: new Date().toISOString(),
        issuer: issuer.user.tag,
      });
      return `${target.user.username} is kicked!`;
    }
    switch (response) {
      case "BOT_PERM":
        return `I do not have permission to kick ${target.user.username}`;
      case "MEMBER_PERM":
        return `You do not have permission to kick ${target.user.username}`;
      default:
        return `Failed to kick ${target.user.username}`;
    }
  } catch (error) {
    console.error("Error kicking user:", error);
    return "Failed to kick the user. Please try again later.";
  }
}
