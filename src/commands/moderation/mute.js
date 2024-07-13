const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "mute",
  description: "Mutes the specified member",
  category: "MODERATION",
  command: {
    enabled: true,
    aliases: ["bl3"],
    usage: "<ID|@member> <duration> [reason]",
    minArgsCount: 2,
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
        name: "duration",
        description: "Duration for the mute (e.g., 1d, 1h, 1m)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for mute",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    // Check for specific roles
    const requiredRoles = ["1226167494226608198", "1226166868952350721"];
    if (!requiredRoles.some(role => message.member.roles.cache.has(role))) {
      return message.safeReply("You do not have the required role to use this command.");
    }

    const match = await message.client.resolveUsers(args[0], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return `User ${target.username} not found in the server.`;

    // Check if target has a higher role than the issuer
    if (member.roles.highest.position >= message.member.roles.highest.position) {
      return message.safeReply("You cannot mute a member with a higher or equal role.");
    }

    const durationString = args[1];
    const duration = ms(durationString);
    if (!duration) return message.safeReply(`Invalid duration specified: ${args[1]}`);
    const reason = args.slice(2).join(" ") || "No reason provided";

    const response = await mute(message.member, target, reason, duration);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    // Check for specific roles
    const requiredRoles = ["1226167494226608198", "1226166868952350721"];
    if (!requiredRoles.some(role => interaction.member.roles.cache.has(role))) {
      return interaction.followUp("You do not have the required role to use this command.");
    }

    const target = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return `User ${target.username} not found in the server.`;

    // Check if target has a higher role than the issuer
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.followUp("You cannot mute a member with a higher or equal role.");
    }

    const durationString = interaction.options.getString("duration");
    const duration = ms(durationString);
    if (!duration) return interaction.followUp(`Invalid duration specified: ${durationString}`);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const response = await mute(interaction.member, target, reason, duration);
    await interaction.followUp(response);
  },
};

async function mute(issuer, target, reason, duration) {
  const mutedRoleId = "1232370037843689472";
  const mutedRole = issuer.guild.roles.cache.get(mutedRoleId);
  const logChannelId = "1225439125776367697"; // Channel to send the embed

  if (!mutedRole) {
    return "Muted role not found in the server.";
  }

  const member = await issuer.guild.members.fetch(target.id).catch(() => null);
  if (!member) return `User ${target.username} not found in the server.`;

  try {
    const endTime = new Date(Date.now() + duration);
    const endTimeString = endTime.toLocaleString('en-GB', { timeZone: 'Africa/Algiers', hour12: false });

    const dmMessage = `### 🤐 You have been muted in **${issuer.guild.name}** for __***${ms(duration, { long: true })}***__ reason: __***${reason}***__ ###

### The mute will automatically be removed on: ${endTimeString}. Please follow the server rules <#1200477076113850468> to avoid further actions. ###

### In case you believe the mute was unfair, you can appeal your mute here: [FLOW Appeal](https://discord.gg/YuJbSBxbrX) ###`;

    try {
      await target.send(dmMessage);
    } catch (error) {
      console.error(`Failed to send DM to ${target.username}:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

    await member.roles.add(mutedRole, reason);

    // Log the mute action
    // logAction(target.id, {
    //   type: 'mute',
    //   reason,
    //   duration: ms(duration, { long: true }),
    //   date: new Date().toISOString(),
    //   issuer: issuer.user.tag,
    //   issuerId: issuer.user.id,
    // });

    // Create and send the embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: `Moderation - Mute`, iconURL: issuer.user.displayAvatarURL() })
      .setColor("#FF0000")
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Member", value: `${target.tag} [${target.id}]`, inline: false },
        { name: "Reason", value: reason || "No reason provided", inline: false },
        { name: "Duration", value: ms(duration, { long: true }), inline: true },
        { name: "Responsible Moderator", value: `${issuer.user.tag} [${issuer.user.id}]`, inline: false },
        { name: "Mute End Time", value: endTimeString, inline: false }
      )
      .setFooter({ text: `Muted by ${issuer.user.tag}`, iconURL: issuer.user.displayAvatarURL() })
      .setTimestamp();

    const logChannel = issuer.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    setTimeout(async () => {
      try {
        await member.roles.remove(mutedRole, "Mute duration expired");

        // Send unmute embed to log channel
        const unmuteEmbed = new EmbedBuilder()
          .setTitle("User Unmuted")
          .setColor("#00FF00")
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: "User", value: `${target.tag} [${target.id}]`, inline: true },
            { name: "Moderator", value: "System", inline: true },
            { name: "Reason", value: "Mute duration expired", inline: true },
            { name: "Unmute Time", value: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Algiers', hour12: false }), inline: true }
          )
          .setTimestamp();

        if (logChannel) {
          await logChannel.send({ embeds: [unmuteEmbed] });
        }
      } catch (error) {
        console.error(`Failed to unmute ${target.username} after temporary mute:`, error);
      }
    }, duration);

    return `${target.username} is muted for ${ms(duration, { long: true })}!`;
  } catch (error) {
    console.error("Error muting user:", error);
    return "Failed to mute the user. Please try again later.";
  }
}
