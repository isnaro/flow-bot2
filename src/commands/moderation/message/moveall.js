const { ChannelType } = require("discord.js");
const move = require("../shared/move");

module.exports = {
  name: "moveall",
  description: "Move all members in a voice channel to another channel",
  category: "MODERATION",
  userPermissions: ["MoveMembers"],
  botPermissions: ["MoveMembers"],
  command: {
    enabled: true,
    usage: "<current-channel-id> <destination-channel-id> [reason] or <destination-channel-id> [reason]",
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const allowedRoles = ["1200477300093878385", "1200477902387544185", "1226166523136180276"]; // Role IDs allowed to use the command
    const memberRoles = message.member.roles.cache.map(role => role.id);

    if (!allowedRoles.some(role => memberRoles.includes(role))) {
      return message.safeReply("You do not have permission to use this command.");
    }

    let sourceChannelId;
    let destinationChannelId;
    let reason;

    if (args.length === 1) {
      destinationChannelId = args[0];
    } else if (args.length >= 2) {
      sourceChannelId = args[0];
      destinationChannelId = args[1];
      reason = args.slice(2).join(" ");
    }

    if (!destinationChannelId) {
      return message.safeReply("Please provide the destination channel ID.");
    }

    // Resolve source and destination channels
    let sourceChannel;
    let destinationChannel;

    if (sourceChannelId) {
      sourceChannel = message.guild.channels.cache.get(sourceChannelId);
    } else {
      const currentVoiceChannel = message.member.voice.channel;
      if (!currentVoiceChannel) {
        return message.safeReply("You need to be in a voice channel to use this command without specifying the source channel.");
      }
      sourceChannel = currentVoiceChannel;
    }

    destinationChannel = message.guild.channels.cache.get(destinationChannelId);

    if (!destinationChannel) {
      return message.safeReply("The specified destination channel does not exist or is not a voice channel.");
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

    // Check if the moderator has permissions in the destination channel
    if (!destinationChannel.permissionsFor(message.member).has("MoveMembers")) {
      return message.safeReply("You do not have the required permissions in the destination channel.");
    }

    const response = await moveAll(message, membersToMove, reason, destinationChannel);
    await message.safeReply(response);
  },
};

async function moveAll(message, members, reason, destinationChannel) {
  try {
    const movePromises = members.map(member => move(message, member, reason, destinationChannel));
    await Promise.all(movePromises);
    return `Moved ${members.length} member(s) to ${destinationChannel.toString()}.`;
  } catch (error) {
    console.error("Error moving members:", error);
    return "Failed to move members. Please try again later.";
  }
}
