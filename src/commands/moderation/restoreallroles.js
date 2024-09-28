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
    const targetId = args[0].replace(/[<@!>]/g, ''); // Remove mention syntax
    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    // Fetch stored roles from MongoDB
    const storedRoles = await UserRoles.findOne({ userId: target.id, guildId: message.guild.id });
    if (!storedRoles || storedRoles.roles.length === 0) {
      return message.safeReply("No roles found to restore for this user.");
    }

    // Restore roles
    try {
      await target.roles.add(storedRoles.roles);
      // Remove stored roles from the database after restoring
      await UserRoles.deleteOne({ userId: target.id, guildId: message.guild.id });
      message.safeReply(`Restored roles to ${target.user.username}.`);
    } catch (error) {
      console.error("Failed to restore roles:", error);
      message.safeReply("Failed to restore roles. Ensure the bot has the appropriate permissions.");
    }
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.followUp(`No user found matching ${target.id}`);

    // Fetch stored roles from MongoDB
    const storedRoles = await UserRoles.findOne({ userId: member.id, guildId: interaction.guild.id });
    if (!storedRoles || storedRoles.roles.length === 0) {
      return interaction.followUp("No roles found to restore for this user.");
    }

    // Restore roles
    try {
      await member.roles.add(storedRoles.roles);
      // Remove stored roles from the database after restoring
      await UserRoles.deleteOne({ userId: member.id, guildId: interaction.guild.id });
      interaction.followUp(`Restored roles to ${member.user.username}.`);
    } catch (error) {
      console.error("Failed to restore roles:", error);
      interaction.followUp("Failed to restore roles. Ensure the bot has the appropriate permissions.");
    }
  },
};
