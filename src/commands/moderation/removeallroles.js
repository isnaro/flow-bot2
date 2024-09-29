const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "removeallroles",
  description: "Removes all roles from a specified user.",
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

    // Get the user to remove roles from
    const targetId = args[0].replace(/[<@!>]/g, ''); // Remove mention syntax if necessary
    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) return message.channel.send(`No user found matching ${args[0]}`);

    // Get all roles excluding @everyone
    const rolesToRemove = target.roles.cache.filter(role => role.id !== message.guild.id);
    if (rolesToRemove.size === 0) return message.channel.send("User has no roles to remove.");

    // Remove all roles
    try {
      await target.roles.remove(rolesToRemove);
      message.channel.send(`Removed all roles from ${target.user.username}.`);
    } catch (error) {
      console.error("Error removing roles:", error);
      message.channel.send("An error occurred while trying to remove roles.");
    }
  },
};
