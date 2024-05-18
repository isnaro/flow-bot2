const { Message } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "temprole",
  description: "Adds a temporary role to a user",
  category: "MODERATION",
  userPermissions: [],
  botPermissions: ["ManageRoles"],
  command: {
    enabled: true,
    usage: "<user-id|@user> <duration> <role-name>",
    minArgsCount: 3,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const allowedRoles = [
      "1200591829754712145", "1200592378671681666", "1200771376592736256",
      "1200776755066191882", "1200776664133677159", "1230662535233929296",
      "1230662625956859946", "1200592956831305799", "1201137840134824027",
      "1200485716220723220", "1201137925216272424", "1201137119335292948",
      "1201137753295962112", "1200592759438987374", "1201138020569600000",
      "1228770600437284884", "1230020471458762812", "1229485803546087528",
      "1228771212759666719", "1229485828385013883", "1229485917530751027",
      "1229486246024318997", "1230020926695800832", "1230022271779868672",
      "1240812672321065010", "1226607519305302077", "1237163989818015825",
      "1226216396690817177"
    ];

    const allowedToAddAllRoles = message.member.roles.cache.has("1200477300093878385") || message.member.roles.cache.has("1200477902387544185");
    const allowedToRemoveAllRoles = allowedToAddAllRoles;
    const allowedToManageRoles = message.member.roles.cache.has("1226167494226608198");

    const userIdOrMention = args[0];
    const duration = args[1];
    const roleName = args.slice(2).join(" ");

    const targetMember = await resolveMember(message, userIdOrMention);
    if (!targetMember) return message.safeReply(`No user found matching ${userIdOrMention}`);

    const targetRole = findClosestRole(message.guild, roleName, allowedRoles);
    if (!targetRole) return message.safeReply(`No role found matching ${roleName}`);

    if (allowedToManageRoles) {
      if (targetMember.roles.cache.has(targetRole.id)) {
        if (allowedToRemoveAllRoles) {
          await targetMember.roles.remove(targetRole);
          return message.safeReply(`Successfully removed ${targetRole.name} from ${targetMember.user.username}`);
        } else {
          return message.safeReply("You do not have permission to remove this role.");
        }
      } else {
        if (allowedToAddAllRoles) {
          await targetMember.roles.add(targetRole);
          return message.safeReply(`Successfully added ${targetRole.name} to ${targetMember.user.username} for ${duration}`);
        } else {
          return message.safeReply("You do not have permission to add this role.");
        }
      }
    } else {
      return message.safeReply("You do not have permission to manage roles.");
    }
  }
};

async function resolveMember(message, userIdOrMention) {
  let targetMember;

  if (message.mentions.members.size) {
    targetMember = message.mentions.members.first();
  } else {
    targetMember = await message.guild.members.fetch(userIdOrMention).catch(() => null);
  }

  return targetMember;
}

function findClosestRole(guild, roleName, allowedRoles) {
  let closestRole = null;
  let closestDistance = Infinity;

  for (const roleId of allowedRoles) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      const distance = getLevenshteinDistance(roleName.toLowerCase(), role.name.toLowerCase());
      if (distance < closestDistance) {
        closestDistance = distance;
        closestRole = role;
      }
    }
  }

  return closestRole;
}

function getLevenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
