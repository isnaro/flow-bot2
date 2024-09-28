const { ApplicationCommandOptionType } = require("discord.js");
const UserRoles = require("../../models/userRoles");

module.exports = {
  name: "restoreallroles",
  description: "Restores all roles to a user that were removed using the removeallroles command.",
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
    console.log("restoreallroles command invoked with args:", args);
    try {
      const targetId = args[0].replace(/[<@!>]/g, ''); // Remove mention syntax
      const target = await message.guild.members.fetch(targetId).catch(() => null);
      if (!target) {
        console.log(`No user found matching ${args[0]}`);
        return message.channel.send(`No user found matching ${args[0]}`);
      }

      // Fetch stored roles from MongoDB
      const storedRoles = await UserRoles.findOne({ userId: target.id, guildId: message.guild.id });
      if (!storedRoles || storedRoles.roles.length === 0) {
        console.log("No roles found to restore for this user.");
        return message.channel.send("No roles found to restore for this user.");
      }

      // Restore roles
      await target.roles.add(storedRoles.roles);
      await UserRoles.deleteOne({ userId: target.id, guildId: message.guild.id });
      console.log(`Roles restored to ${target.user.username}`);
      message.channel.send(`Restored roles to ${target.user.username}.`);
      
    } catch (error) {
      console.error("Error in restoreallroles command:", error);
      message.channel.send("An error occurred while trying to restore roles.");
    }
  },

  async interactionRun(interaction) {
    console.log("restoreallroles slash command invoked");
    try {
      const target = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) {
        console.log(`No user found matching ${target.id}`);
        return interaction.followUp(`No user found matching ${target.id}`);
      }

      // Fetch stored roles from MongoDB
      const storedRoles = await UserRoles.findOne({ userId: member.id, guildId: interaction.guild.id });
      if (!storedRoles || storedRoles.roles.length === 0) {
        console.log("No roles found to restore for this user.");
        return interaction.followUp("No roles found to restore for this user.");
      }

      // Restore roles
      await member.roles.add(storedRoles.roles);
      await UserRoles.deleteOne({ userId: member.id, guildId: interaction.guild.id });
      console.log(`Roles restored to ${member.user.username}`);
      interaction.followUp(`Restored roles to ${member.user.username}.`);
      
    } catch (error) {
      console.error("Error in restoreallroles command:", error);
      interaction.followUp("An error occurred while trying to restore roles.");
    }
  },
};
