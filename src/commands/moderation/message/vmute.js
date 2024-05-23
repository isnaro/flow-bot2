const { ChannelType, EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "vmute",
  description: "Mutes specified member's voice or all members in a voice channel",
  category: "MODERATION",
  userPermissions: ["MuteMembers"],
  botPermissions: ["MuteMembers"],
  command: {
    enabled: true,
    usage: "<ID|@member> <reason> <period> or <channel-id> <reason>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const allowedRolesForChannelMute = ["1200477300093878385", "1200477902387544185"]; // Role IDs allowed to use channel-based mute
    const allowedRolesForUserMute = ["1200477300093878385", "1200477902387544185", "1226167494226608198"]; // Role IDs allowed to use user-based mute

    const memberRoles = message.member.roles.cache.map(role => role.id);
    const channelArg = args[0];
    const reason = args[1];
    const period = args[2] ? ms(args[2]) : null; // If a period is specified, parse it into milliseconds

    if (channelArg.match(/^\d+$/)) { // If the argument is a channel ID
      if (!allowedRolesForChannelMute.some(role => memberRoles.includes(role))) {
        return message.safeReply("You do not have permission to use channel-based mute.");
      }

      const targetChannel = message.guild.channels.cache.get(channelArg);

      if (!targetChannel || !(targetChannel.type === ChannelType.GuildVoice || targetChannel.type === ChannelType.GuildStageVoice)) {
        return message.safeReply("The specified channel is not a valid voice channel.");
      }

      const membersToMute = targetChannel.members.map(member => member);

      if (membersToMute.length === 0) {
        return message.safeReply("There are no members to mute in the specified channel.");
      }

      const response = await muteAll(message, membersToMute, reason, period);
      await message.safeReply(response);
    } else { // Otherwise, treat it as a member mention or ID
      if (!allowedRolesForUserMute.some(role => memberRoles.includes(role))) {
        return message.safeReply("You do not have permission to use user-based mute.");
      }

      const target = await message.guild.members.fetch(channelArg).catch(() => null);
      if (!target) return message.safeReply(`No user found matching ${channelArg}`);

      const response = await vmute(message, target, reason, period);
      await message.safeReply(response);
    }
  },
};

async function muteAll(message, members, reason, period) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = message.guild.channels.cache.get(logChannelId);

  try {
    for (const member of members) {
      if (member.voice) {
        await member.voice.setMute(true, reason);
        if (period) {
          setTimeout(async () => {
            await member.voice.setMute(false, "Mute duration expired");
            await logUnmute(member, "Automatic unmute after duration expired");
          }, period);
        }
      }
    }

    // Create and send the embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: `Moderation - Voice Mute`, iconURL: message.author.displayAvatarURL() })
      .setColor("#FF0000")
      .setDescription(`${members.length} members have been muted in the voice channel.`)
      .addFields(
        { name: "Moderator", value: `${message.author.tag} [${message.author.id}]`, inline: true },
        { name: "Reason", value: reason, inline: true },
        { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: "User IDs", value: members.map(member => member.id).join(", "), inline: false }
      )
      .setTimestamp();

    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    return `Muted ${members.length} member(s) in the channel.`;
  } catch (error) {
    console.error("Error muting members:", error);
    return "Failed to mute members. Please try again later.";
  }
}

async function vmute(message, target, reason, period) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = message.guild.channels.cache.get(logChannelId);

  try {
    if (target.voice) {
      await target.voice.setMute(true, reason);
      if (period) {
        setTimeout(async () => {
          await target.voice.setMute(false, "Mute duration expired");
          await logUnmute(target, "Automatic unmute after duration expired");
        }, period);
      }
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
  } catch (error) {
    console.error("Error muting member:", error);
    return "Failed to mute the member. Please try again later.";
  }
}

async function logUnmute(member, reason) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = member.guild.channels.cache.get(logChannelId);

  try {
    // Create and send the embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: `Moderation - Voice Unmute`, iconURL: member.user.displayAvatarURL() })
      .setColor("#00FF00")
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription(`${member.user.tag} has been unmuted in the voice channel.`)
      .addFields(
        { name: "Reason", value: reason, inline: true },
        { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: "User ID", value: `${member.id}`, inline: false }
      )
      .setTimestamp();

    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Error logging unmute:", error);
  }
}
