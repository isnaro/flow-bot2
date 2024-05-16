const { warnTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const sendWarningDM = require("./sendWarningDM");

module.exports = {
  name: "warn",
  description: "Warns the specified member",
  category: "MODERATION",
  userPermissions: ["KICK_MEMBERS"],
  command: {
    enabled: true,
    usage: "<@member> [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The target member",
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the warn",
        type: ApplicationCommandOptionType.STRING,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.safeReply(`No user mentioned.`);
    args.shift(); // Remove the mentioned user from the arguments
    const reason = args.join(" ");
    const response = await warn(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason");
    const target = user;

    const response = await warn(interaction.member, target, reason);
    await interaction.reply(response);
  },
};

async function warn(issuer, target, reason) {
  const response = await warnTarget(issuer, target, reason);

  if (typeof response === "boolean") {
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
