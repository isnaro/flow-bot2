const { warnTarget, timeoutTarget, kickTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

// Constants for server-specific information
const RULES_CHANNEL_ID = "1200477076113850468"; // ID of the rules channel
const FLOW_APPEAL_LINK = "https://discord.gg/N22QZw34VT"; // Link to the Flow Appeal

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "warn",
  description: "Warns the specified member",
  category: "MODERATION",
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
        description: "Reason for warn",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = args.slice(1).join(" ") || "No reason provided";
    const response = await warn(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id);

    const response = await warn(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function warn(issuer, target, reason) {
  try {
    const response = await warnTarget(issuer, target, reason);
    if (typeof response === "boolean") {
      // Delay the sending of DM message by 1 second
      setTimeout(async () => {
        try {
          await target.send(
            `## ⚠️⚠️ You have been warned in FLOW for: **${reason}** ##\n\n`
            + `Please follow the server rules in <#${RULES_CHANNEL_ID}>. If you believe the warn was unfair, create a ticket through <${FLOW_APPEAL_LINK}> or from <Flow Appeal>.`
          );
        } catch (err) {
          console.error(`Failed to send DM to ${target.user.username}:`, err);
        }
      }, 1000); // 1 second delay

      return `${target.user.username} has been warned!`;
    }
    switch (response) {
      case "BOT_PERM":
        return `I do not have permission to warn ${target.user.username}`;
      case "MEMBER_PERM":
        return `You do not have permission to warn ${target.user.username}`;
      default:
        return `Failed to warn ${target.user.username}`;
    }
  } catch (error) {
    console.error("Error warning user:", error);
    return "Failed to warn the user. Please try again later.";
  }
}
