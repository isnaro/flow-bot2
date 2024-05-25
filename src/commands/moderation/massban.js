const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "massban",
  description: "Bans multiple specified members",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  command: {
    enabled: true,
    usage: "<ID|@member> <ID|@member> ...",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false, // Disable slash command version for simplicity
  },

  async messageRun(message, args) {
    const targets = await resolveMultipleUsers(message.client, args);
    if (targets.length === 0) return message.safeReply("No valid users found to ban.");

    const reason = "Mass ban initiated";
    const response = await massban(message.member, targets, reason);
    await message.safeReply(response);
  },
};

async function resolveMultipleUsers(client, args) {
  const users = [];
  for (const arg of args) {
    const match = await client.resolveUsers(arg, true);
    if (match.length > 0) {
      users.push(match[0]);
    }
  }
  return users;
}

async function massban(issuer, targets, reason) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = issuer.guild.channels.cache.get(logChannelId);

  const currentTime = new Date();
  const gmtPlusOneOffset = 60 * 60 * 1000; // 1 hour in milliseconds
  const banTime = new Date(currentTime.getTime() + gmtPlusOneOffset);
  const banTimeString = banTime.toUTCString().replace("GMT", "GMT+1");

  try {
    for (const target of targets) {
      const banMessage = `### 🔴🔴 You were banned from **${issuer.guild.name}** for __***${reason}***__ ###`;
      const dmMessage = `${banMessage}\n\n### In case you believe the ban was unfair, you can appeal your ban here: [FLOW Appeal](https://discord.gg/YuJbSBxbrX) ###`;

      try {
        await target.send(dmMessage);
      } catch (error) {
        console.error(`Failed to send DM to ${target.username}:`, error);
      }

      setTimeout(async () => {
        await issuer.guild.members.ban(target, { reason });

        // Send embed to log channel
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle("User Banned")
            .setColor("#FF0000")
            .setThumbnail(target.displayAvatarURL())
            .addFields(
              { name: "User", value: `${target.tag} [${target.id}]`, inline: true },
              { name: "Moderator", value: `${issuer.user.tag} [${issuer.id}]`, inline: true },
              { name: "Reason", value: reason, inline: true },
              { name: "Ban Time", value: banTimeString, inline: true },
            )
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }
      }, 1000); // 1-second delay before banning each user
    }

    return `Successfully initiated mass ban for ${targets.length} users.`;
  } catch (error) {
    console.error("Error mass banning users:", error);
    return "Failed to mass ban the users. Please try again later.";
  }
}
