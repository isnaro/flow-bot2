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
    aliases: ["mban"],
    usage: "<ID|@member> <ID|@member> ... [duration]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false, // Disable slash command version for simplicity
  },

  async messageRun(message, args) {
    if (args.length === 0) return message.safeReply("No user IDs provided to ban.");

    const durationString = args[args.length - 1];
    const duration = ms(durationString);
    const targets = duration ? await resolveMultipleUsers(message.client, args.slice(0, -1)) : await resolveMultipleUsers(message.client, args);

    if (targets.length === 0) return message.safeReply("No valid users found to ban.");

    const reason = "Mass ban initiated";
    const response = await massban(message.member, targets, reason, duration);
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

async function massban(issuer, targets, reason, duration) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = issuer.guild.channels.cache.get(logChannelId);

  const currentTime = new Date();
  const gmtPlusOneOffset = 60 * 60 * 1000; // 1 hour in milliseconds
  const banTime = new Date(currentTime.getTime() + gmtPlusOneOffset);
  const banTimeString = banTime.toUTCString().replace("GMT", "GMT+1");

  try {
    for (const target of targets) {
      const banMessage = `### 🔴🔴 You were banned from **${issuer.guild.name}** for __***${reason}***__ ###`;

      if (duration) {
        const unbanDate = new Date(currentTime.getTime() + duration + gmtPlusOneOffset);
        const unbanDateString = unbanDate.toUTCString().replace("GMT", "GMT+1");
        const durationMessage = `Duration: __***${ms(duration, { long: true })}***__. Your ban will be lifted on: **${unbanDateString}**`;

        const dmMessage = `${banMessage}\n\n${durationMessage}\n\n### In case you believe the ban was unfair, you can appeal your ban here: [FLOW Appeal](https://discord.gg/YuJbSBxbrX) ###`;

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
                { name: "Duration", value: ms(duration, { long: true }), inline: true },
                { name: "Ban Time", value: banTimeString, inline: true },
                { name: "Unban Date", value: unbanDateString, inline: true },
              )
              .setTimestamp();
            await logChannel.send({ embeds: [embed] });
          }

          setTimeout(async () => {
            try {
              await issuer.guild.members.unban(target.id, "Ban duration expired");

              // Send unban embed to log channel
              if (logChannel) {
                const unbanEmbed = new EmbedBuilder()
                  .setTitle("User Unbanned")
                  .setColor("#00FF00")
                  .setThumbnail(target.displayAvatarURL())
                  .addFields(
                    { name: "User", value: `${target.tag} [${target.id}]`, inline: true },
                    { name: "Moderator", value: "System", inline: true },
                    { name: "Reason", value: "Ban duration expired", inline: true },
                    { name: "Unban Time", value: new Date(Date.now() + gmtPlusOneOffset).toUTCString().replace("GMT", "GMT+1"), inline: true }
                  )
                  .setTimestamp();
                await logChannel.send({ embeds: [unbanEmbed] });
              }
            } catch (error) {
              console.error(`Failed to unban ${target.username} after temporary ban:`, error);
            }
          }, duration);

        }, 100); // 100ms delay before banning

      } else {
        try {
          await target.send(banMessage);
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
        }, 100); // 100ms delay before banning
      }
    }

    return `Successfully initiated mass ban for ${targets.length} users.`;
  } catch (error) {
    console.error("Error mass banning users:", error);
    return "Failed to mass ban the users. Please try again later.";
  }
}
