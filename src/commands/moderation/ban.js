const { banTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ban",
  description: "Bans the specified member",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
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
        description: "Reason for ban",
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
    const response = await ban(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const response = await ban(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

/**
 * @param {import('discord.js').GuildMember} issuer
 * @param {import('discord.js').User} target
 * @param {string} reason
 */
async function ban(issuer, target, reason) {
  try {
    const response = await banTarget(issuer, target, reason);
    if (typeof response === "boolean") {
      // Send custom direct message to the banned user
      await target.send(`You were banned from the server for the following reason: ${reason}`);
      return `${target.username} is banned!`;
    }
    if (response === "BOT_PERM") return `I do not have permission to ban ${target.username}`;
    else if (response === "MEMBER_PERM") return `You do not have permission to ban ${target.username}`;
    else return `Failed to ban ${target.username}`;
  } catch (error) {
    console.error("Error banning user:", error);
    return "Failed to ban the user. Please try again later.";
  }
}
