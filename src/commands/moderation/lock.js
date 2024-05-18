const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "lock",
  description: "Locks the channel by revoking send messages permission for @everyone",
  category: "UTILITY",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  command: {
    enabled: true,
    aliases: ["lockchannel"],
    usage: "",
  },
  slashCommand: {
    enabled: true,
    options: [],
  },

  async messageRun(message, args) {
    const channel = message.channel;

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SEND_MESSAGES: false });
      await message.safeReply("Channel locked successfully.");
    } catch (error) {
      console.error("Error locking channel:", error);
      await message.safeReply("Failed to lock the channel. Please try again later.");
    }
  },

  async interactionRun(interaction) {
    const channel = interaction.channel;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SEND_MESSAGES: false });
      await interaction.followUp("Channel locked successfully.");
    } catch (error) {
      console.error("Error locking channel:", error);
      await interaction.followUp("Failed to lock the channel. Please try again later.");
    }
  },
};
