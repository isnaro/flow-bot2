const { ChannelType, EmbedBuilder } = require("discord.js");
const ms = require("ms");

// Map to store muted members and their unmute timeouts
const mutedMembers = new Map();

module.exports = {
  name: "vmute",
  description: "Mutes specified member's voice or all members in a voice channel",
  category: "MODERATION",
  userPermissions: ["MuteMembers"],
  botPermissions: ["MuteMembers"],
  command: {
    enabled: true,
    usage: "<ID|@member> [reason] [duration]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const allowedRolesForChannelMute = ["1200477300093878385", "1200477902387544185"]; // Role IDs allowed to use channel-based mute
    const allowedRolesForUserMute = ["1200477300093878385", "1200477902387544185", "1226167494226608198"]; // Role IDs allowed to use user-based mute

    const memberRoles = message.member.roles.cache.map(role => role.id);
    const userOrChannelArg = args[0];
    const durationArg = args[args.length - 1];
    const duration = ms(durationArg);
    const reason = duration ? args.slice(1, -1).join(" ") : args.slice(1).join(" ") || "No reason provided";

    if (userOrChannelArg.match(/^\d+$/) && message.guild.channels.cache.has(userOrChannelArg)) {
      // If the argument is a channel ID
      if (!allowedRolesForChannelMute.some(role => memberRoles.includes(role))) {
        return message.safeReply("You do not have permission to use channel-based mute.");
      }

      const targetChannel = message.guild.channels.cache.get(userOrChannelArg);

      if (!targetChannel || !(targetChannel.type === ChannelType.GuildVoice || targetChannel.type === ChannelType.GuildStageVoice)) {
        return message.safeReply("The specified channel is not a valid voice channel.");
      }

      const membersToMute = Array.from(targetChannel.members.values());

      if (membersToMute.length === 0) {
        return message.safeReply("There are no members to mute in the specified channel.");
      }

      const response = await muteAll(message, membersToMute, reason, duration);
      return message.safeReply(response);
    } else {
      // Otherwise, treat it as a member mention or ID
      if (!allowedRolesForUserMute.some(role => memberRoles.includes(role))) {
        return message.safeReply("You do not have permission to use user-based mute.");
      }

      const target = await message.guild.members.fetch(userOrChannelArg).catch(() => null);
      if (!target) return message.safeReply(`No user found matching ${userOrChannelArg}`);

      const response = await vmute(message, target, reason, duration);
      return message.safeReply(response);
    }
  },
};

async function muteAll(message, members, reason, duration) {
  try {
    for (const member of members) {
      if (member.voice.channel) {
        await member.voice.setMute(true, reason);
        if (duration) {
          const unmuteTimeout = setTimeout(async () => {
            await member.voice.setMute(false, "Mute duration expired");
            await logUnmute(member, message.author, "Mute duration expired");
            mutedMembers.delete(member.id);
          }, duration);
          mutedMembers.set(member.id, unmuteTimeout);
        }
      }
    }
    return `Muted ${members.length} member(s) in the channel.`;
  } catch (error) {
    console.error("Error muting members:", error);
    return "Failed to mute members. Please try again later.";
  }
}

async function vmute(message, target, reason, duration) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = message.guild.channels.cache.get(logChannelId);

  try {
    if (target.voice.channel) {
      await target.voice.setMute(true, reason);

      if (duration) {
        const unmuteTimeout = setTimeout(async () => {
          await target.voice.setMute(false, "Mute duration expired");
          await logUnmute(target, message.author, "Mute duration expired");
          mutedMembers.delete(target.id);
        }, duration);
        mutedMembers.set(target.id, unmuteTimeout);
      }

      // Create and send the embed
      const embed = new EmbedBuilder()
        .setAuthor({ name: `Moderation - Voice Mute`, iconURL: message.author.displayAvatarURL() })
        .setColor("#FF0000")
        .setThumbnail(target.user.displayAvatarURL())
        .setDescription(`${target.user.tag} has been muted in the voice channel.`)
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

      return `${target.user.tag} has been muted.`;
    } else {
      return `${target.user.tag} is not in a voice channel.`;
    }
  } catch (error) {
    console.error("Error muting member:", error);
    return "Failed to mute the member. Please try again later.";
  }
}

async function logUnmute(member, moderator, reason) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = member.guild.channels.cache.get(logChannelId);

  // Create and send the embed
  const embed = new EmbedBuilder()
    .setAuthor({ name: `Moderation - Voice Unmute`, iconURL: moderator.displayAvatarURL() })
    .setColor("#00FF00")
    .setThumbnail(member.user.displayAvatarURL())
    .setDescription(`${member.user.tag} has been unmuted in the voice channel.`)
    .addFields(
      { name: "Moderator", value: `${moderator.tag} [${moderator.id}]`, inline: true },
      { name: "Reason", value: reason, inline: true },
      { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
      { name: "User ID", value: `${member.id}`, inline: false }
    )
    .setTimestamp();

  if (logChannel) {
    await logChannel.send({ embeds: [embed] });
  }
}
