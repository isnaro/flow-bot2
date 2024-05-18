const { ApplicationCommandOptionType, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "lock",
  description: "Locks the channel by revoking send messages permission for @everyone",
  category: "UTILITY",
  botPermissions: [PermissionFlagsBits.ManageChannels],
  userPermissions: [PermissionFlagsBits.ManageChannels],
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
    const roleID = "1226167494226608198";

    // Check if the user has ManageChannels permission or the specific role
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageChannels) &&
      !message.member.roles.cache.has(roleID)
    ) {
      return message.reply("You do not have the necessary permissions to use this command.");
    }

    try {
      // Lock the channel by revoking SEND_MESSAGES permission for @everyone
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SEND_MESSAGES: false,
      });
      await message.reply("Channel locked successfully.");
    } catch (error) {
      console.error("Error locking channel:", error);
      await message.reply("Failed to lock the channel. Please try again later.");
    }
  },

  async interactionRun(interaction) {
    const channel = interaction.channel;
    const roleID = "1226167494226608198";

    // Check if the user has ManageChannels permission or the specific role
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) &&
      !interaction.member.roles.cache.has(roleID)
    ) {
      return interaction.reply("You do not have the necessary permissions to use this command.", { ephemeral: true });
    }

    try {
      // Lock the channel by revoking SEND_MESSAGES permission for @everyone
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SEND_MESSAGES: false,
      });
      await interaction.reply("Channel locked successfully.");
    } catch (error) {
      console.error("Error locking channel:", error);
      await interaction.reply("Failed to lock the channel. Please try again later.", { ephemeral: true });
    }
  },
};
