const { Permissions } = require("discord.js");

module.exports = {
  name: "lock",
  description: "Locks the channel by revoking send messages permission for @everyone",
  category: "UTILITY",
  botPermissions: ["MANAGE_CHANNELS"],
  userPermissions: ["MANAGE_CHANNELS"],
  async execute(message, args) {
    const channel = message.channel;

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SEND_MESSAGES: false
      });
      await message.channel.send("Channel locked successfully.");
    } catch (error) {
      console.error("Error locking channel:", error);
      await message.channel.send("Failed to lock the channel. Please check the bot's permissions and try again later.");
    }
  }
};
