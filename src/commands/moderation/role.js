const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "role",
  description: "Adds or removes a specified role from a user",
  category: "MODERATION",
  userPermissions: ["ManageRoles"],
  botPermissions: ["ManageRoles"],
  command: {
    enabled: true,
    usage: "<user-id|@user> <role-name>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The target user",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "role",
        description: "The role to add or remove",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const requiredRoleId = "1226167494226608198"; // Role ID allowed to use the command

    if (!message.member.roles.cache.has(requiredRoleId)) {
      return message.safeReply("You do not have permission to use this command.");
    }

    const targetUser = await message.guild.resolveMember(args[0], true);
    if (!targetUser) return message.safeReply(`No user found matching ${args[0]}`);

    const roleName = args.slice(1).join(" ");
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) return message.safeReply(`No role found with the name ${roleName}`);

    const response = await toggleRole(targetUser, role);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const requiredRoleId = "1226167494226608198"; // Role ID allowed to use the command

    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.followUp("You do not have permission to use this command.");
    }

    const user = interaction.options.getUser("user");
    const roleName = interaction.options.getString("role");
    const targetUser = await interaction.guild.members.fetch(user.id);
    const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());

    if (!role) return interaction.followUp(`No role found with the name ${roleName}`);

    const response = await toggleRole(targetUser, role);
    await interaction.followUp(response);
  },
};

async function toggleRole(targetUser, role) {
  try {
    if (targetUser.roles.cache.has(role.id)) {
      await targetUser.roles.remove(role);
      return `Successfully removed the role ${role.name} from ${targetUser.user.username}.`;
    } else {
      await targetUser.roles.add(role);
      return `Successfully added the role ${role.name} to ${targetUser.user.username}.`;
    }
  } catch (error) {
    console.error("Error toggling role:", error);
    return "Failed to toggle the role. Please try again later.";
  }
}
