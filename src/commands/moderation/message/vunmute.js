const vunmute = require("../shared/vunmute");
const { ChannelType } = require("discord.js");

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
    const reason = args.slice(1).join(" ");

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
      const target = await message.guild.resolveMember(channelArg, true);
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
