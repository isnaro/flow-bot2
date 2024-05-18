const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "unmute",
  description: "Unmutes the specified member",
  category: "MODERATION",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
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
        description: "Reason for unmute",
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

    const response = await unmute(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const response = await unmute(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function unmute(issuer, target, reason) {
  const mutedRoleId = "1232370037843689472"; // Assuming this is the muted role ID
  const mutedRole = issuer.guild.roles.cache.get(mutedRoleId);
  const logChannelId = "1225439125776367697"; // Channel to send the embed

  if (!mutedRole) {
    return "Muted role not found in the server.";
  }

  const member = await issuer.guild.members.fetch(target.id).catch(() => null);
  if (!member) return `User ${target.username} not found in the server.`;

  if (!member.roles.cache.has(mutedRole.id)) {
    return `${target.username} is not muted.`;
  }

  try {
    await member.roles.remove(mutedRole, reason);

    // Create and send the embed
    const logChannel = issuer.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: `Moderation - Unmute`, iconURL: issuer.user.displayAvatarURL() })
        .setColor("#00FF00")
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "Member", value: `${target.tag} [${target.id}]`, inline: false },
          { name: "Reason", value: reason || "No reason provided", inline: false }
        )
        .setFooter({
          text: `Unmuted by ${issuer.user.tag} [${issuer.user.id}]`,
          iconURL: issuer.user.displayAvatarURL(),
        })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    return `${target.username} has been unmuted.`;
  } catch (error) {
    console.error("Error unmuting user:", error);
    return "Failed to unmute the user. Please try again later.";
  }
}




// Automatic Unmute logging


async function unmute(issuer, target, reason) {
    const mutedRoleId = "1232370037843689472"; // Assuming this is the muted role ID
    const mutedRole = issuer.guild.roles.cache.get(mutedRoleId);
    const logChannelId = "1225439125776367697"; // Channel to send the embed
  
    if (!mutedRole) {
      return "Muted role not found in the server.";
    }
  
    const member = await issuer.guild.members.fetch(target.id).catch(() => null);
    if (!member) return `User ${target.username} not found in the server.`;
  
    if (!member.roles.cache.has(mutedRole.id)) {
      return `${target.username} is not muted.`;
    }
  
    try {
      await member.roles.remove(mutedRole, reason);
  
      // Determine the responsible moderator and the duration since the mute
      const responsibleModerator = getResponsibleModerator(member);
      const muteDuration = getMuteDuration(member);
  
      // Create the reason for automatic unmute
      const automaticUnmuteReason = `Automatic unmute after a mute made by ${responsibleModerator} ${muteDuration} ago`;
  
      // Create and send the embed
      const logChannel = issuer.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: `Moderation - Unmute`, iconURL: issuer.user.displayAvatarURL() })
          .setColor("#00FF00")
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: "Member", value: `${target.tag} [${target.id}]`, inline: false },
            { name: "Reason", value: automaticUnmuteReason, inline: false }
          )
          .setFooter({
            text: `Unmuted by ${issuer.user.tag} [${issuer.user.id}]`,
            iconURL: issuer.user.displayAvatarURL(),
          })
          .setTimestamp();
  
        await logChannel.send({ embeds: [embed] });
      }
  
      return `${target.username} has been automatically unmuted.`;
    } catch (error) {
      console.error("Error unmuting user:", error);
      return "Failed to unmute the user. Please try again later.";
    }
  }
  
  function getResponsibleModerator(member) {
    // Implement your logic here to determine the responsible moderator for the mute
    // For example, you can fetch the moderator who issued the mute command from your database
    return "Responsible Moderator";
  }
  
  function getMuteDuration(member) {
    // Implement your logic here to calculate the duration since the mute
    // For example, you can calculate the difference between the current time and the mute timestamp
    return "1 hour"; // Example duration
  }
  