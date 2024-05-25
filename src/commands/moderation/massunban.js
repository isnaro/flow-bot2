const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "massunban",
  description: "Unbans multiple specified members",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  command: {
    enabled: true,
    aliases: ["munban"],
    usage: "<ID> <ID> ...",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false, // Disable slash command version for simplicity
  },

  async messageRun(message, args) {
    if (args.length === 0) return message.safeReply("No user IDs provided to unban.");

    const response = await massunban(message.member, args);
    await message.safeReply(response);
  },
};

async function massunban(issuer, userIds) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = issuer.guild.channels.cache.get(logChannelId);

  const currentTime = new Date();
  const gmtPlusOneOffset = 60 * 60 * 1000; // 1 hour in milliseconds
  const unbanTime = new Date(currentTime.getTime() + gmtPlusOneOffset);
  const unbanTimeString = unbanTime.toUTCString().replace("GMT", "GMT+1");

  try {
    for (const userId of userIds) {
      try {
        await issuer.guild.members.unban(userId, "Mass unban initiated");

        // Send embed to log channel
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle("User Unbanned")
            .setColor("#00FF00")
            .addFields(
              { name: "User ID", value: `${userId}`, inline: true },
              { name: "Moderator", value: `${issuer.user.tag} [${issuer.id}]`, inline: true },
              { name: "Reason", value: "Mass unban initiated", inline: true },
              { name: "Unban Time", value: unbanTimeString, inline: true },
            )
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error(`Failed to unban user with ID ${userId}:`, error);
      }
    }

    return `Successfully initiated mass unban for ${userIds.length} users.`;
  } catch (error) {
    console.error("Error mass unbanning users:", error);
    return "Failed to mass unban the users. Please try again later.";
  }
}
