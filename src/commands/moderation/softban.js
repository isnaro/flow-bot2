const { softbanTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "softban",
  description: "Softban the specified member. Kicks and deletes messages",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    aliases: ["sban"],
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
        description: "Reason for softban",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim() || "No reason provided";
    const response = await softban(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id);

    const response = await softban(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function softban(issuer, target, reason) {
  const logChannelId = "1225439125776367697"; // Channel to send the embed

  try {
    await target.send(
      `## 🔴🔴 You have been soft-banned from FLOW for: ***${reason}*** ##

### Please follow the server rules <#1200477076113850468> to avoid further actions. ###

### In case you believe the softban was unfair, you can appeal your softban here: [FLOW Appeal](https://discord.gg/YuJbSBxbrX) ###`
    );
  } catch (err) {
    console.error(`Failed to send DM to ${target.user.username}:`, err);
  }

  const response = await softbanTarget(issuer, target, reason);
  if (typeof response === "boolean") {
    // Send log embed
    const logChannel = issuer.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: `Moderation - Softban`, iconURL: issuer.user.displayAvatarURL() })
        .setColor("#FF0000")
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: "Member", value: `${target.user.tag} [${target.user.id}]`, inline: false },
          { name: "Reason", value: reason, inline: false },
        )
        .setFooter({
          text: `Softbanned by ${issuer.user.tag} [${issuer.user.id}]`,
          iconURL: issuer.user.displayAvatarURL(),
        })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    return `${target.user.username} is soft-banned!`;
  }

  if (response === "BOT_PERM") return `I do not have permission to softban ${target.user.username}`;
  if (response === "MEMBER_PERM") return `You do not have permission to softban ${target.user.username}`;
  return `Failed to softban ${target.user.username}`;
}
