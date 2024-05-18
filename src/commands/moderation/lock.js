const { Permissions, MessageEmbed } = require("discord.js");

module.exports = {
  name: "lock",
  category: "moderation",
  description: "Locks a Channel",
  async execute(bot, message, args) {
    // Role ID that should have permission to use this command
    const specialRoleID = "1226167494226608198";

    // Check if the user has the required permissions
    if (
      !message.member.permissions.has([Permissions.FLAGS.MANAGE_CHANNELS]) &&
      !message.member.roles.cache.has(specialRoleID)
    ) {
      return message.channel.send("You don't have enough Permissions");
    }

    try {
      // Lock the channel by denying SEND_MESSAGES permission for @everyone
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SEND_MESSAGES: false,
      });

      const embed = new MessageEmbed()
        .setTitle("Channel Updates")
        .setDescription(`${message.channel} has been locked`)
        .setColor("RANDOM");

      await message.channel.send({ embeds: [embed] });
      message.delete();
    } catch (error) {
      console.error("Error locking channel:", error);
      await message.channel.send("Failed to lock the channel. Please try again later.");
    }
  },
};
