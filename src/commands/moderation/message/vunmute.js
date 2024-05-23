const { ChannelType, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "vunmute",
  description: "Unmutes specified member's voice or all members in a voice channel",
  category: "MODERATION",
  userPermissions: ["MuteMembers"],
  botPermissions: ["MuteMembers"],
  command: {
    enabled: true,
    usage: "<ID|@member> [reason] or <channel-id>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const allowedRoles = ["1200477300093878385", "1200477902387544185"]; // Role IDs allowed to use the command
    const memberRoles = message.member.roles.cache.map(role => role.id);

    if (!allowedRoles.some(role => memberRoles.includes(role))) {
      return message.safeReply("You do not have permission to use this command.");
    }

    const channelArg = args[0];
    const reason = args.slice(1).join(" ") || "No reason provided";

    // If the argument is a channel ID
    if (channelArg.match(/^\d+$/)) {
      const targetChannel = message.guild.channels.cache.get(channelArg);

      if (!targetChannel || !(targetChannel.type === ChannelType.GuildVoice || targetChannel.type === ChannelType.GuildStageVoice)) {
        return message.safeReply("The specified channel is not a valid voice channel.");
      }

      const membersToUnmute = targetChannel.members.map(member => member);

      if (membersToUnmute.length === 0) {
        return message.safeReply("There are no members to unmute in the specified channel.");
      }

      const response = await unmuteAll(message, membersToUnmute, reason);
      await message.safeReply(response);
    } else { // Otherwise, treat it as a member mention or ID
      const target = await message.guild.members.fetch(channelArg).catch(() => null);
      if (!target) return message.safeReply(`No user found matching ${channelArg}`);
      
      const response = await vunmute(message, target, reason);
      await message.safeReply(response);
    }
  },
};

async function unmuteAll(message, members, reason) {
  try {
    for (const member of members) {
      await vunmute(message, member, reason);
    }
    return `Unmuted ${members.length} member(s) in the channel.`;
  } catch (error) {
    console.error("Error unmuting members:", error);
    return "Failed to unmute members. Please try again later.";
  }
}

async function vunmute(message, target, reason) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = message.guild.channels.cache.get(logChannelId);

  try {
    if (target.voice) {
      await target.voice.setMute(false, reason);
    }

    // Create and send the embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: `Moderation - Voice Unmute`, iconURL: message.author.displayAvatarURL() })
      .setColor("#00FF00")
      .setThumbnail(target.user.displayAvatarURL())
      .setDescription(`${target.user.tag} has been unmuted in the voice channel.`)
      .addFields(
        { name: "Moderator", value: `${message.author.tag} [${message.author.id}]`, inline: true },
        { name: "Reason", value: reason, inline: true },
        { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: "User ID", value: `${target.id}`, inline: false }
      )
      .setTimestamp();

    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    return `${target.user.tag} has been unmuted.`;
  } catch (error) {
    console.error("Error unmuting member:", error);
    return "Failed to unmute the member. Please try again later.";
  }
}
