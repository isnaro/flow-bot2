const { ApplicationCommandOptionType } = require("discord.js");
const UserRoles = require("../../models/userRoles");

module.exports = {
  name: "removeallroles",
  description: "Removes all roles from a user and stores them for later restoration.",
  category: "MODERATION",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  command: {
    enabled: true,
    usage: "<ID|@member>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    console.log("removeallroles command invoked with args:", args);
    try {
      const targetId = args[0].replace(/[<@!>]/g, ''); // Remove mention syntax
      const target = await message.guild.members.fetch(targetId).catch(() => null);
      if (!target) {
        console.log(`No user found matching ${args[0]}`);
        return message.channel.send(`No user found matching ${args[0]}`);
      }

      // Get roles excluding @everyone
      const roles = target.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.id);
      if (roles.length === 0) {
        console.log("User has no roles to remove.");
        return message.channel.send("User has no roles to remove.");
      }

      // Save roles to MongoDB
      await UserRoles.findOneAndUpdate(
        { userId: target.id, guildId: message.guild.id },
        { roles },
        { upsert: true, new: true }
      );

      // Remove all roles
      await target.roles.remove(roles);
      console.log(`Roles removed from ${target.user.username}`);
      message.channel.send(`Removed all roles from ${target.user.username} and stored them for restoration.`);
      
    } catch (error) {
      console.error("Error in removeallroles command:", error);
      message.channel.send("An error occurred while trying to remove roles.");
    }
  },

  async interactionRun(interaction) {
    console.log("removeallroles slash command invoked");
    try {
      const target = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) {
        console.log(`No user found matching ${target.id}`);
        return interaction.followUp(`No user found matching ${target.id}`);
      }

      // Get roles excluding @everyone
      const roles = member.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.id);
      if (roles.length === 0) {
        console.log("User has no roles to remove.");
        return interaction.followUp("User has no roles to remove.");
      }

      // Save roles to MongoDB
      await UserRoles.findOneAndUpdate(
        { userId: member.id, guildId: interaction.guild.id },
        { roles },
        { upsert: true, new: true }
      );

      // Remove all roles
      await member.roles.remove(roles);
      console.log(`Roles removed from ${member.user.username}`);
      interaction.followUp(`Removed all roles from ${member.user.username} and stored them for restoration.`);
      
    } catch (error) {
      console.error("Error in removeallroles command:", error);
      interaction.followUp("An error occurred while trying to remove roles.");
    }
  },
};
