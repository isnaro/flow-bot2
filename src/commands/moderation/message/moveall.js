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
    usage: "<current-channel-id> <destination-channel-id> [reason]",
    minArgsCount: 2,
  },

  async messageRun(message, args) {
    const sourceChannelId = args[0];
    const destinationChannelId = args[1];

    const sourceChannel = message.guild.channels.cache.get(sourceChannelId);
    const destinationChannel = message.guild.channels.cache.get(destinationChannelId);

    if (!sourceChannel || !destinationChannel) {
      return message.safeReply("One of the specified channels does not exist.");
    }

    if (
      !(
        sourceChannel.type === ChannelType.GuildVoice ||
        sourceChannel.type === ChannelType.GuildStageVoice
      ) ||
      !(
        destinationChannel.type === ChannelType.GuildVoice ||
        destinationChannel.type === ChannelType.GuildStageVoice
      )
    ) {
      return message.safeReply("Both source and destination channels must be voice channels.");
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
