const { ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "lock",
  description: "Locks the current channel, preventing everyone from sending messages",
  category: "MODERATION",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  command: {
    enabled: true,
    usage: "",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "channel",
        description: "The channel to lock (default is current channel)",
        type: ApplicationCommandOptionType.Channel,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const response = await lockChannel(channel, message.member);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    const response = await lockChannel(channel, interaction.member);
    await interaction.followUp(response);
  },
};

async function lockChannel(channel, issuer) {
  if (!channel.permissionsFor(issuer).has(PermissionsBitField.Flags.ManageChannels)) {
    return "You do not have permission to manage this channel.";
  }

  try {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      SendMessages: false,
    });

    return `🔒 ${channel.name} has been locked.`;
  } catch (error) {
    console.error(`Failed to lock ${channel.name}:`, error);
    return "Failed to lock the channel. Please try again later.";
  }
}
