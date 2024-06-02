const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "ban",
  description: "Bans the specified member",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  command: {
    enabled: true,
    aliases: ["bn8"],
    usage: "<ID|@member> [duration] [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    aliases: ["bn8"],
    options: [
      {
        name: "user",
        description: "The target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "duration",
        description: "Duration for the ban (e.g., 1d, 1h, 1m)",
        type: ApplicationCommandOptionType.String,
        required: false,
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

    if (message.member.id === target.id) {
      return message.safeReply("You cannot ban yourself.");
    }

    const durationString = args[1];
    const duration = durationString ? ms(durationString) : null;
    const reason = duration ? args.slice(2).join(" ") : args.slice(1).join(" ");
    const response = await ban(message.member, target, reason || "No reason provided", duration);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");

    if (interaction.member.id === target.id) {
      return interaction.followUp("You cannot ban yourself.");
    }

    const durationString = interaction.options.getString("duration");
    const duration = durationString ? ms(durationString) : null;
    const reason = interaction.options.getString("reason") || "No reason provided";

    const response = await ban(interaction.member, target, reason, duration);
    await interaction.followUp(response);
  },
};

async function ban(issuer, target, reason, duration) {
  if (issuer.id === target.id) {
    return "You cannot ban yourself.";
  }

  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = issuer.guild.channels.cache.get(logChannelId);

  const currentTime = new Date();
  const gmtPlusOneOffset = 60 * 60 * 1000; // 1 hour in milliseconds
  const banTime = new Date(currentTime.getTime() + gmtPlusOneOffset);
  const banTimeString = banTime.toUTCString().replace("GMT", "GMT+1");

  try {
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
            .setAuthor({ name: "Moderation - Ban" })
            .setColor("#2f3136")
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
              { name: "Member", value: `${target.tag} [${target.id}]`, inline: false },
              { name: "Reason", value: reason, inline: false },
              { name: "Duration", value: duration ? ms(duration, { long: true }) : "Permanent", inline: true },
              { name: "Expires", value: duration ? `<t:${Math.floor((Date.now() + duration) / 1000)}:R>` : "Never", inline: true },
              { name: "Unban Date", value: unbanDateString, inline: true }
            )
            .setFooter({ text: `Banned by ${issuer.user.tag} [${issuer.id}]`, iconURL: issuer.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }

        setTimeout(async () => {
          try {
            await issuer.guild.members.unban(target.id, "Ban duration expired");

            // Send unban embed to log channel
            if (logChannel) {
              const unbanEmbed = new EmbedBuilder()
                .setAuthor({ name: "Moderation - Unban" })
                .setColor("#2f3136")
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                  { name: "Member", value: `${target.tag} [${target.id}]`, inline: false },
                  { name: "Reason", value: "Ban duration expired", inline: false },
                  { name: "Unban Time", value: new Date(Date.now() + gmtPlusOneOffset).toUTCString().replace("GMT", "GMT+1"), inline: false }
                )
                .setFooter({ text: `Unbanned by System`, iconURL: issuer.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();
              await logChannel.send({ embeds: [unbanEmbed] });
            }
          } catch (error) {
            console.error(`Failed to unban ${target.username} after temporary ban:`, error);
          }
        }, duration);

      }, 1000); // 1-second delay before banning

      return `${target.username} will be banned in 1 second for ${ms(duration, { long: true })}!`;
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
            .setAuthor({ name: "Moderation - Ban" })
            .setColor("#2f3136")
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
              { name: "Member", value: `${target.tag} [${target.id}]`, inline: false },
              { name: "Reason", value: reason, inline: false },
              { name: "Duration", value: "Permanent", inline: true },
              { name: "Expires", value: "Never", inline: true }
            )
            .setFooter({ text: `Banned by ${issuer.user.tag} [${issuer.id}]`, iconURL: issuer.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }
      }, 1000); // 1-second delay before banning

      return `${target.username} will be permanently banned in 1 second!`;
    }
  } catch (error) {
    console.error("Error banning user:", error);
    return "Failed to ban the user. Please try again later.";
  }
}
