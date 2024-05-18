const { ApplicationCommandOptionType } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "tempvlock",
  description: "Temporarily locks the voice channel for @everyone by denying the 'connect' permission.",
  category: "MODERATION",
  userPermissions: ["MANAGE_CHANNELS"],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "duration",
        description: "Duration for the temporary voice channel lock (e.g., 1h, 30m)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction) {
    const channel = interaction.member.voice.channel;
    if (!channel) return interaction.reply("You need to be in a voice channel to use this command.");

    const durationString = interaction.options.getString("duration");
    const durationMs = ms(durationString);
    if (!durationMs) return interaction.reply("Invalid duration format. Please provide a valid duration (e.g., 1h, 30m).");

    try {
      await channel.permissionOverwrites.create(interaction.guild.roles.everyone, {
        CONNECT: false,
      });

      setTimeout(async () => {
        await channel.permissionOverwrites.delete(interaction.guild.roles.everyone);
        interaction.followUp(`Voice channel unlocked after ${durationString}.`);
      }, durationMs);

      interaction.reply(`Voice channel locked for @everyone for ${durationString}.`);
    } catch (error) {
      console.error("Error locking voice channel temporarily:", error);
      interaction.reply("Failed to lock the voice channel temporarily. Please try again later.");
    }
  },
};
