const { ChannelType } = require("discord.js");
const move = require("../shared/move");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "moveall",
  description: "Move all members in a voice channel to another channel",
  category: "MODERATION",
  userPermissions: ["MoveMembers"],
  botPermissions: ["MoveMembers"],
  command: {
    enabled: true,
    usage: "<current-channel> <destination-channel> [reason]",
    minArgsCount: 2,
  },

  async messageRun(message, args) {
    const allowedRoles = ["1200477300093878385", "1200477902387544185"]; // Role IDs allowed to use the command
    const memberRoles = message.member.roles.cache.map(role => role.id);

    if (!allowedRoles.some(role => memberRoles.includes(role))) {
      return message.safeReply("You do not have permission to use this command.");
    }

    const sourceChannelName = args[0];
    const destinationChannelName = args[1];

    const sourceChannel = message.guild.channels.cache.find(channel => channel.name === sourceChannelName && (
      channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice
    ));
    
    const destinationChannel = message.guild.channels.cache.find(channel => channel.name === destinationChannelName && (
      channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice
    ));

    if (!sourceChannel || !destinationChannel) {
      return message.safeReply("One of the specified channels does not exist or is not a voice channel.");
    }

    if (sourceChannel === destinationChannel) {
      return message.safeReply("Source and destination channels cannot be the same.");
    }

    const membersToMove = sourceChannel.members.map(member => member);

    if (membersToMove.length === 0) {
      return message.safeReply("There are no members to move in the specified source channel.");
    }

    const reason = args.slice(2).join(" ");
    const response = await moveAll(message, membersToMove, reason, destinationChannel);
    await message.safeReply(response);
  },
};

async function moveAll(message, members, reason, destinationChannel) {
  try {
    for (const member of members) {
      await move(message, member, reason, destinationChannel);
    }
    return `Moved ${members.length} member(s) to ${destinationChannel.toString()}.`;
  } catch (error) {
    console.error("Error moving members:", error);
    return "Failed to move members. Please try again later.";
  }
}
