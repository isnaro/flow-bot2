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
      "1226167494226608198", // Only users with this role can add/remove roles
      "1200477300093878385",
      "1200477902387544185",
      // Add the additional allowed roles here
      "1228770600437284884",
      "1230020471458762812",
      "1229485803546087528",
      "1228771212759666719",
      "1229485828385013883",
      "1229485917530751027",
      "1229486246024318997",
      "1230020926695800832",
      "1230022271779868672",
      "1240812672321065010",
      "1226607519305302077",
      "1237163989818015825",
      "1226216396690817177"
    ];

    const [userIdOrMention, duration, roleName] = args;

    const targetMember = await resolveMember(message, userIdOrMention);
    if (!targetMember) return message.safeReply(`No user found matching ${userIdOrMention}`);

    const targetRole = findClosestRole(message.guild, roleName, allowedRoles);
    if (!targetRole) return message.safeReply(`No role found matching ${roleName}`);

    if (!message.member.roles.cache.has(targetRole.id)) {
      return message.safeReply("You do not have permission to add or remove this role.");
    }

    if (targetMember.roles.cache.has(targetRole.id)) {
      await targetMember.roles.remove(targetRole);
    } else {
      await targetMember.roles.add(targetRole);
    }

    message.safeReply(`Successfully ${targetMember.roles.cache.has(targetRole.id) ? "added" : "removed"} ${targetRole.name} from ${targetMember.user.username} for ${duration}`);

    setTimeout(async () => {
      if (targetMember.roles.cache.has(targetRole.id)) {
        await targetMember.roles.remove(targetRole);
        message.safeReply(`Successfully removed ${targetRole.name} from ${targetMember.user.username}`);
      }
    }, parseDuration(duration));
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
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function parseDuration(duration) {
  const regex = /^(\d+)([smhdwMy])$/i;
  const matches = regex.exec(duration);
  if (!matches) return 0;

  const num = parseInt(matches[1]);
  const unit = matches[2].toLowerCase();

  switch (unit) {
    case 's':
      return num * 1000;
    case 'm':
      return num * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    case 'd':
      return num * 24 * 60 * 60 * 1000;
    case 'w':
      return num * 7 * 24 * 60 * 60 * 1000;
    case 'M':
      return num * 30 * 24 * 60 * 60 * 1000;
    case 'y':
      return num * 365 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}
