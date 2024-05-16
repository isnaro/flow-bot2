const { warnTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const sendWarningDM = require("./sendWarningDM");

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
        description: "Reason for the warn",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await warn(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await warn(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function warn(issuer, target, reason) {
  const response = await warnTarget(issuer, target, reason);

  if (typeof response === "boolean") {
    // Warn successful, now send a DM to the offender
    try {
      await sendWarningDM(issuer.client, reason, target.id);
      return `${target.user.username} has been warned and notified!`;
    } catch (error) {
      console.error("Error sending warning DM:", error);
      return `Warning sent to ${target.user.username}, but failed to send notification.`;
    }
  } else if (response === "BOT_PERM") {
    return `I do not have permission to warn ${target.user.username}`;
  } else if (response === "MEMBER_PERM") {
    return `You do not have permission to warn ${target.user.username}`;
  } else {
    return `Failed to warn ${target.user.username}`;
  }
}
