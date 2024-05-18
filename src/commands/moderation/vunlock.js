const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "vunlock",
  description: "Unlocks the voice channel by resetting permissions to allow connecting for @everyone.",
  category: "MODERATION",
  userPermissions: ["MANAGE_CHANNELS"],
  slashCommand: {
    enabled: true,
  },

  async interactionRun(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== "GUILD_VOICE") return interaction.reply("This command must be used in a voice channel.");

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        CONNECT: null,
      });

      interaction.reply("Voice channel unlocked.");
    } catch (error) {
      console.error("Error unlocking voice channel:", error);
      interaction.reply("Failed to unlock the voice channel. Please try again later.");
    }
  },
};
