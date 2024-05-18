const { timeoutTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const ems = require("enhanced-ms");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "timeout",
  description: "timeouts the specified member",
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
        description: "the target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "duration",
        description: "the time to timeout the member for",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "reason for timeout",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    // parse time
    const ms = ems(args[1]);
    if (!ms) return message.safeReply("Please provide a valid duration. Example: 1d/1h/1m/1s");

    const reason = args.slice(2).join(" ").trim() || "No reason provided";
    const response = await timeout(message.member, target, ms, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");

    // parse time
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

  try {
    const endTime = new Date(Date.now() + ms);
    const endTimeString = endTime.toLocaleString();

    try {
      await target.send(
        `## ⏰⏰ You have been timed out in FLOW for : ***${reason}*** ##

### The timeout duration is: ${ems(ms, { long: true })}. It will be automatically removed on: ${endTimeString}. Please follow the server rules <#1200477076113850468> to avoid further actions. ###`
      );
    } catch (err) {
      console.error(`Failed to send DM to ${target.user.username}:`, err);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

    const response = await timeoutTarget(issuer, target, ms, reason);
    if (typeof response === "boolean") {
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
  } catch (error) {
    console.error("Error timing out user:", error);
    return "Failed to timeout the user. Please try again later.";
  }
}
