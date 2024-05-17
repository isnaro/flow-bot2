const { warnTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "warn",
  description: "warns the specified member",
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
        description: "the target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "reason for warn",
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
      try {
        await target.send(
          `## ⚠️⚠️ You have been warned in FLOW for : ***${reason}*** ##

### Please adhere to the server rules to avoid further actions. ###`
        );
      } catch (err) {
        console.error(`Failed to send DM to ${target.user.username}:`, err);
      }
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
