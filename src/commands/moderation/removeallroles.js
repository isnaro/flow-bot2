const { PermissionsBitField } = require("discord.js");
const UserRoles = require("../../models/userRoles");

module.exports = {
  name: "removeallroles",
  description: "Removes all roles from a user and stores them for later restoration.",
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
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.channel.send("You do not have permission to use this command.");
    }

    const targetId = args[0].replace(/[<@!>]/g, ''); // Clean up user input
    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) return message.channel.send(`No user found matching ${args[0]}`);

    // Get roles excluding @everyone
    const roles = target.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.id);
    if (roles.length === 0) return message.channel.send("User has no roles to remove.");

    // Save roles to MongoDB
    await UserRoles.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { roles },
      { upsert: true, new: true }
    );

    // Remove all roles
    try {
      await target.roles.remove(roles);
      message.channel.send(`Removed all roles from ${target.user.username} and stored them for restoration.`);
    } catch (error) {
      console.error("Error in removeallroles command:", error);
      message.channel.send("An error occurred while trying to remove roles.");
    }
  },
};
