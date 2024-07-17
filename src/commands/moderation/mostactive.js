const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "mostactive",
  description: "Gives the 'Most Active' role to a specified member for 48 hours",
  category: "MODERATION",
  command: {
    enabled: true,
    usage: "<ID|@member>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    // Check for the specific role
    const requiredRoleId = "1226167494226608198";
    if (!message.member.roles.cache.has(requiredRoleId)) {
      return message.safeReply("You do not have the required role to use this command.");
    }

    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const response = await giveMostActiveRole(message.member, target);
    await message.safeReply(response);
  },
};

async function giveMostActiveRole(issuer, target) {
  const mostActiveRoleId = "1262975792032251945";
  const mostActiveRole = issuer.guild.roles.cache.get(mostActiveRoleId);

  if (!mostActiveRole) {
    return "Most Active role not found in the server.";
  }

  const member = await issuer.guild.members.fetch(target.id).catch(() => null);
  if (!member) return `User ${target.user.username} not found in the server.`;

  try {
    const dmMessage = `### 🎉 Congratulations! You have been awarded the **Most Active** role in **${issuer.guild.name}** for 48 hours! Keep up the great participation! ###`;

    try {
      await target.send(dmMessage);
    } catch (error) {
      console.error(`Failed to send DM to ${target.user.username}:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

    await member.roles.add(mostActiveRole, "Awarded Most Active role for 48 hours");

    // Create and send the embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: `Most Active Award`, iconURL: issuer.user.displayAvatarURL() })
      .setColor("#FFD700")
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: "Member", value: `${target.user.tag} [${target.id}]`, inline: false },
        { name: "Duration", value: "48 hours", inline: true },
        { name: "Awarded By", value: `${issuer.user.tag} [${issuer.user.id}]`, inline: false }
      )
      .setFooter({ text: `Awarded by ${issuer.user.tag}`, iconURL: issuer.user.displayAvatarURL() })
      .setTimestamp();

    const logChannelId = "1225439125776367697"; // Log channel ID
    const logChannel = issuer.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    setTimeout(async () => {
      try {
        await member.roles.remove(mostActiveRole, "48 hours duration expired");

        // Send unassign embed to log channel
        const unassignEmbed = new EmbedBuilder()
          .setTitle("Most Active Role Removed")
          .setColor("#FF0000")
          .setThumbnail(target.user.displayAvatarURL())
          .addFields(
            { name: "User", value: `${target.user.tag} [${target.id}]`, inline: true },
            { name: "Reason", value: "48 hours duration expired", inline: true },
            { name: "Time", value: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Algiers', hour12: false }), inline: true }
          )
          .setTimestamp();

        if (logChannel) {
          await logChannel.send({ embeds: [unassignEmbed] });
        }
      } catch (error) {
        console.error(`Failed to remove Most Active role from ${target.user.username} after 48 hours:`, error);
      }
    }, ms('48h'));

    return `${target.user.username} has been awarded the 'Most Active' role for 48 hours!`;
  } catch (error) {
    console.error("Error assigning Most Active role:", error);
    return "Failed to assign the 'Most Active' role. Please try again later.";
  }
}
