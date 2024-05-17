const { ChannelType } = require("discord.js");

module.exports = {
  name: "vmute",
  description: "Mutes specified member's voice or all members in a voice channel",
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
    const allowedRolesForChannelMute = ["1200477300093878385", "1200477902387544185"]; // Role IDs allowed to use channel-based mute
    const allowedRolesForUserMute = ["1200477300093878385", "1200477902387544185", "1226167494226608198"]; // Role IDs allowed to use user-based mute

    const memberRoles = message.member.roles.cache.map(role => role.id);
    const channelArg = args[0];
    const reason = args.slice(1).join(" ");

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

      const response = await muteAll(message, membersToMute, reason);
      await message.safeReply(response);
    } else { // Otherwise, treat it as a member mention or ID
      if (!allowedRolesForUserMute.some(role => memberRoles.includes(role))) {
        return message.safeReply("You do not have permission to use user-based mute.");
      }

      const target = await message.guild.resolveMember(channelArg, true);
      if (!target) return message.safeReply(`No user found matching ${channelArg}`);
      
      const response = await vmute(message, target, reason);
      await message.safeReply(response);
    }
  },
};

async function muteAll(message, members, reason) {
  try {
    for (const member of members) {
      if (member.voice) {
        await member.voice.setMute(true, reason);
      }
    }
    return `Muted ${members.length} member(s) in the channel.`;
  } catch (error) {
    console.error("Error muting members:", error);
    return "Failed to mute members. Please try again later.";
  }
}
