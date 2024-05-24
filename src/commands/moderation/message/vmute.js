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

    // Identify if the last argument is a duration
    const durationArg = args[args.length - 1];
    const duration = ms(durationArg);
    const reasonArgs = duration ? args.slice(1, -1) : args.slice(1);
    const reason = reasonArgs.join(" ") || "No reason provided";

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
      .setAuthor({
        name: `${message.guild.name} Modlogs`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setColor("#2f3136")
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `**Member:** ${target.user.tag} (${target.id})\n` +
        `**Action:** Voice Mute\n` +
        `**Reason:** ${reason}\n` +
        `**Duration:** ${duration ? ms(duration, { long: true }) : "Indefinite"}\n` +
        `**Moderator:** ${message.author.tag} (${message.author.id})`
      )
      .setFooter({
        text: `ID: ${target.id}`,
        iconURL: target.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

      if (logChannel) {
        logChannel.send({ embeds: [embed] });
      }

      return `Muted ${target.user.tag} for reason: ${reason}.`;
    } else {
      return `${target.user.tag} is not in a voice channel.`;
    }
  } catch (error) {
    console.error("Error muting member:", error);
    return "Failed to voice mute the member. Please try again later.";
  }
}

async function logUnmute(member, moderator, reason) {
  const logChannelId = "1225439125776367697"; // Log channel ID
  const logChannel = member.guild.channels.cache.get(logChannelId);

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${member.guild.name} Modlogs`,
      iconURL: member.guild.iconURL({ dynamic: true }),
    })
    .setColor("#2f3136")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `**Member:** ${member.user.tag} (${member.id})\n` +
      `**Action:** Voice Unmute\n` +
      `**Reason:** ${reason}\n` +
      `**Moderator:** ${moderator.tag} (${moderator.id})`
    )
    .setFooter({
      text: `ID: ${member.id}`,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
}