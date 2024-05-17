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
    usage: "<destination-channel> [reason]",
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const allowedRoles = ["1200477300093878385", "1200477902387544185"]; // Role IDs allowed to use the command
    const memberRoles = message.member.roles.cache.map(role => role.id);

    if (!allowedRoles.some(role => memberRoles.includes(role))) {
      return message.safeReply("You do not have permission to use this command.");
    }

    // Resolve destination channel
    let destinationChannel;

    if (args[0].match(/^\d+$/)) {
      // If only the destination channel ID is provided
      destinationChannel = message.guild.channels.cache.get(args[0]);
    } else {
      // If the user is in a voice channel, use it as the source channel
      const currentVoiceChannel = message.member.voice.channel;
      if (!currentVoiceChannel) {
        return message.safeReply("You need to be in a voice channel to use this command without specifying the source channel.");
      }
      destinationChannel = resolveChannel(message, args[0]);
    }

    if (!destinationChannel) {
      return message.safeReply("The specified channel does not exist or is not a voice channel.");
    }

    if (
      !(
        destinationChannel.type === ChannelType.GuildVoice ||
        destinationChannel.type === ChannelType.GuildStageVoice
      )
    ) {
      return message.safeReply("The destination channel must be a voice channel.");
    }

    // Get members from source channel
    const sourceChannelMembers = message.member.voice.channel.members.map(member => member);

    if (sourceChannelMembers.length === 0) {
      return message.safeReply("There are no members to move in your current voice channel.");
    }

    const reason = args.slice(1).join(" ");
    const response = await moveAll(message, sourceChannelMembers, reason, destinationChannel);
    await message.safeReply(response);
  },
};

// Function to resolve channel by mention or ID
function resolveChannel(message, channelIdOrMention) {
  const channelId = channelIdOrMention.replace(/^<#|>$/g, ''); // Remove <# and > from the mention
  return message.guild.channels.cache.get(channelId) || message.guild.channels.cache.find(channel => channel.name === channelId);
}

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
