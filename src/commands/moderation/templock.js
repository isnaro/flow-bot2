const { ApplicationCommandOptionType } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "templock",
  description: "Temporarily locks the channel by revoking send messages permission for @everyone",
  category: "UTILITY",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  command: {
    enabled: true,
    usage: "<duration>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "duration",
        description: "Duration for the lock (e.g., 1h, 30m)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const channel = message.channel;
    const durationString = args[0];
    const duration = ms(durationString);

    if (!duration) {
      return message.safeReply("Invalid duration specified.");
    }

    try {
      await lockChannelTemporarily(channel, duration);
      await message.safeReply(`Channel locked successfully for ${durationString}.`);
    } catch (error) {
      console.error("Error locking channel:", error);
      await message.safeReply("Failed to lock the channel. Please try again later.");
    }
  },

  async interactionRun(interaction) {
    const channel = interaction.channel;
    const durationString = interaction.options.getString("duration");
    const duration = ms(durationString);

    if (!duration) {
      return interaction.followUp("Invalid duration specified.");
    }

    try {
      await lockChannelTemporarily(channel, duration);
      await interaction.followUp(`Channel locked successfully for ${durationString}.`);
    } catch (error) {
      console.error("Error locking channel:", error);
      await interaction.followUp("Failed to lock the channel. Please try again later.");
    }
  },
};

async function lockChannelTemporarily(channel, duration) {
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SEND_MESSAGES: false });
  setTimeout(async () => {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SEND_MESSAGES: null });
  }, duration);
}
