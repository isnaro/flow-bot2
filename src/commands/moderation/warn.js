const { warnTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "warn",
  description: "Warns the specified member",
  category: "MODERATION",
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
    // Check for the specific role
    const requiredRoleId = "1226167494226608198";
    if (!message.member.roles.cache.has(requiredRoleId)) {
      return message.safeReply("You do not have the required role to use this command.");
    }

    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await warn(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    // Check for the specific role
    const requiredRoleId = "1226167494226608198";
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.followUp("You do not have the required role to use this command.");
    }

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await warn(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function warn(issuer, target, reason) {
  const dmMessage = `### ⚠️ You have been warned in **${issuer.guild.name}** for the following reason: __***${reason || "No reason provided"}***__ ###

Please adhere to the server rules to avoid further actions.`;

  try {
    await target.send(dmMessage);
  } catch (error) {
    console.error(`Failed to send DM to ${target.user.username}:`, error);
  }

  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

  const response = await warnTarget(issuer, target, reason);
  if (typeof response === "boolean") return `${target.user.username} is warned!`;
  if (response === "BOT_PERM") return `I do not have permission to warn ${target.user.username}`;
  else if (response === "MEMBER_PERM") return `You do not have permission to warn ${target.user.username}`;
  else return `Failed to warn ${target.user.username}`;
}
