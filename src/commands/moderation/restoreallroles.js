const { PermissionsBitField } = require("discord.js");
const UserRoles = require("../../models/userRoles"); // Make sure this path points to your Mongoose model

module.exports = {
  name: "restoreallroles",
  description: "Restores all roles to a specified user that were removed earlier.",
  category: "MODERATION",
  command: {
    enabled: true,
    usage: "<user-id|@mention>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    // Check if the user running the command has ManageRoles permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.channel.send("You do not have permission to use this command.");
    }

    // Get the user to restore roles to
    const targetId = args[0].replace(/[<@!>]/g, ''); // Clean up user input
    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) return message.channel.send(`No user found matching ${args[0]}`);

    // Fetch stored roles from MongoDB
    const storedRoles = await UserRoles.findOne({ userId: target.id, guildId: message.guild.id });
    if (!storedRoles || storedRoles.roles.length === 0) {
      return message.channel.send("No roles found to restore for this user.");
    }

    // Restore roles
    try {
      await target.roles.add(storedRoles.roles);
      // Remove stored roles from the database after restoring
      await UserRoles.deleteOne({ userId: target.id, guildId: message.guild.id });
      message.channel.send(`Restored roles to ${target.user.username}.`);
    } catch (error) {
      console.error("Error restoring roles:", error);
      message.channel.send("An error occurred while trying to restore roles.");
    }
  },
};
