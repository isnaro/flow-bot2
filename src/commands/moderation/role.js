const { ApplicationCommandOptionType } = require("discord.js");
const Fuse = require("fuse.js");

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
    const allowedRoleIds = [
      "1200591829754712145", "1200592378671681666",
      "1200771376592736256", "1200776755066191882",
      "1200776664133677159", "1230662535233929296",
      "1230662625956859946"
    ]; // Allowed role IDs

    if (!message.member.roles.cache.has(requiredRoleId)) {
      return message.safeReply("You do not have permission to use this command.");
    }

    const targetUser = await message.guild.resolveMember(args[0], true);
    if (!targetUser) return message.safeReply(`No user found matching ${args[0]}`);

    const roleName = args.slice(1).join(" ");
    const role = findClosestRole(message.guild, roleName, allowedRoleIds);
    if (!role) return message.safeReply(`No allowed role found matching ${roleName}`);

    const response = await toggleRole(targetUser, role);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const requiredRoleId = "1226167494226608198"; // Role ID allowed to use the command
    const allowedRoleIds = [
      "1200591829754712145", "1200592378671681666",
      "1200771376592736256", "1200776755066191882",
      "1200776664133677159", "1230662535233929296",
      "1230662625956859946"
    ]; // Allowed role IDs

    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.followUp("You do not have permission to use this command.");
    }

    const user = interaction.options.getUser("user");
    const roleName = interaction.options.getString("role");
    const targetUser = await interaction.guild.members.fetch(user.id);
    const role = findClosestRole(interaction.guild, roleName, allowedRoleIds);

    if (!role) return interaction.followUp(`No allowed role found matching ${roleName}`);

    const response = await toggleRole(targetUser, role);
    await interaction.followUp(response);
  },
};

function findClosestRole(guild, roleName, allowedRoleIds) {
  const roles = guild.roles.cache.filter(role => allowedRoleIds.includes(role.id)).map(role => ({ id: role.id, name: role.name }));
  const fuse = new Fuse(roles, { keys: ["name"], threshold: 0.3 });
  const result = fuse.search(roleName);
  return result.length > 0 ? guild.roles.cache.get(result[0].item.id) : null;
}

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
