const Command = require("../structures/Command.js");
const { Permissions } = require("discord.js");

module.exports = new Command({
  name: "lock",
  description: "Lock the channel that the command is executed in",

  async run(message, args, client) {
    if (message.author.bot) return;

    // Role ID that should have permission to use this command
    const specialRoleID = "1226167494226608198";

    // Check if the user has the required permissions
    if (
      message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
      message.member.roles.cache.has(specialRoleID)
    ) {
      try {
        // Get the @everyone role
        const everyoneRole = message.guild.roles.everyone;

        // Lock the channel by revoking SEND_MESSAGES permission for @everyone
        await message.channel.permissionOverwrites.edit(everyoneRole, {
          SEND_MESSAGES: false,
        });

        // Reply to confirm the channel is locked
        await message.reply(`Channel ${message.channel.name} locked successfully.`);
      } catch (error) {
        console.error("Error locking channel:", error);
        await message.reply("Failed to lock the channel. Please try again later.");
      }
    } else {
      // Reply if the user doesn't have the required permissions
      message.reply("You do not have the necessary permissions to use this command.");
    }
  },
});
