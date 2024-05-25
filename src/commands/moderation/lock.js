const { ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "lock",
  description: "Locks the current channel, preventing everyone from sending messages",
  category: "MODERATION",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  command: {
    enabled: true,
    usage: "[duration]",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "duration",
        description: "Duration for the lock (e.g., 1h, 30m)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "channel",
        description: "The channel to lock (default is current channel)",
        type: ApplicationCommandOptionType.Channel,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const durationString = args[0];
    const duration = durationString ? ms(durationString) : null;
    const channel = message.channel;
    const response = await lockChannel(channel, message.member, duration);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const durationString = interaction.options.getString("duration");
    const duration = durationString ? ms(durationString) : null;
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    const response = await lockChannel(channel, interaction.member, duration);
    await interaction.followUp(response);
  },
};

async function lockChannel(channel, issuer, duration) {
  if (!channel.permissionsFor(issuer).has(PermissionsBitField.Flags.ManageChannels)) {
    return "You do not have permission to manage this channel.";
  }

  try {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      SendMessages: false,
    });

    if (duration) {
      setTimeout(async () => {
        try {
          await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
            SendMessages: true,
          });
          await channel.send(`🔓 ${channel.name} has been automatically unlocked.`);
        } catch (error) {
          console.error(`Failed to unlock ${channel.name}:`, error);
        }
      }, duration);

      return `🔒 ${channel.name} has been locked for ${ms(duration, { long: true })}.`;
    }

    return `🔒 ${channel.name} has been locked.`;
  } catch (error) {
    console.error(`Failed to lock ${channel.name}:`, error);
    return "Failed to lock the channel. Please try again later.";
  }
}
