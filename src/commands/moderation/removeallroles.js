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
    const targetId = args[0].replace(/[<@!>]/g, ''); // Remove mention syntax
    const target = await message.guild.members.fetch(targetId).catch(() => null);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    // Get roles excluding @everyone
    const roles = target.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.id);
    if (roles.length === 0) return message.safeReply("User has no roles to remove.");

    // Save roles to MongoDB
    await UserRoles.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { roles },
      { upsert: true, new: true }
    );

    // Remove all roles
    try {
      await target.roles.remove(roles);
      message.safeReply(`Removed all roles from ${target.user.username} and stored them for restoration.`);
    } catch (error) {
      console.error("Failed to remove roles:", error);
      message.safeReply("Failed to remove roles. Ensure the bot has the appropriate permissions.");
    }
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.followUp(`No user found matching ${target.id}`);

    // Get roles excluding @everyone
    const roles = member.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.id);
    if (roles.length === 0) return interaction.followUp("User has no roles to remove.");

    // Save roles to MongoDB
    await UserRoles.findOneAndUpdate(
      { userId: member.id, guildId: interaction.guild.id },
      { roles },
      { upsert: true, new: true }
    );

    // Remove all roles
    try {
      await member.roles.remove(roles);
      interaction.followUp(`Removed all roles from ${member.user.username} and stored them for restoration.`);
    } catch (error) {
      console.error("Failed to remove roles:", error);
      interaction.followUp("Failed to remove roles. Ensure the bot has the appropriate permissions.");
    }
  },
};
