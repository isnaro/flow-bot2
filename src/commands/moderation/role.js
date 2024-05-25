const { MessageEmbed } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "role",
  description: "Adds or removes a role from a user",
  category: "MODERATION",
  userPermissions: [],
  botPermissions: ["ManageRoles"],
  command: {
    enabled: true,
    usage: "<user-id|@user> <role-name|role-id>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const allowedRoles = [
      "1200591829754712145", "1200771376592736256",
      "1200776755066191882", "1200776664133677159", "1230662535233929296",
      "1230662625956859946", "1200592956831305799", "1201137840134824027",
      "1200485716220723220", "1201137925216272424", "1201137119335292948",
      "1201137753295962112", "1200592759438987374", "1201138020569600000", "1228818077706358904"
    ];

    const allowedToAddRoles = [
      "1226167494226608198",
      "1200477300093878385",
      "1226166868952350721",
      "1226166868952350721",
      "1200477902387544185"
    ];

    let canAddRoles = false;
    let canRemoveRoles = false;

    // Check if the user has permission to add or remove roles
    for (const roleId of allowedToAddRoles) {
      if (message.member.roles.cache.has(roleId)) {
        canAddRoles = true;
        canRemoveRoles = true;
        break;
      }
    }

    if (!canAddRoles && !canRemoveRoles) {
      return message.safeReply("You do not have permission to use this command.");
    }

    const userIdOrMention = args[0];
    const roleNameOrId = args.slice(1).join(" ");

    const targetMember = await resolveMember(message, userIdOrMention);
    if (!targetMember) return message.safeReply(`No user found matching ${userIdOrMention}`);

    const targetRole = findClosestRole(message.guild, roleNameOrId, allowedRoles);
    if (!targetRole) return message.safeReply(`No role found matching ${roleNameOrId}`);

    if (canAddRoles || canRemoveRoles) {
      if (targetMember.roles.cache.has(targetRole.id)) {
        if (canRemoveRoles) {
          await targetMember.roles.remove(targetRole);
          if (targetRole.id === "1200771376592736256") {
            sendRemovalEmbed(message, targetMember, targetRole);
          }
          return message.safeReply(`Successfully removed ${targetRole.name} from ${targetMember.user.username}`);
        } else {
          return message.safeReply("You do not have permission to remove this role.");
        }
      } else {
        if (canAddRoles) {
          await targetMember.roles.add(targetRole);
          return message.safeReply(`Successfully added ${targetRole.name} to ${targetMember.user.username}`);
        } else {
          return message.safeReply("You do not have permission to add this role.");
        }
      }
    } else {
      return message.safeReply("You do not have permission to add or remove this role.");
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

function findClosestRole(guild, roleNameOrId, allowedRoles) {
  let closestRole = guild.roles.cache.get(roleNameOrId);

  if (!closestRole) {
    let closestDistance = Infinity;

    for (const roleId of allowedRoles) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        const distance = getLevenshteinDistance(roleNameOrId.toLowerCase(), role.name.toLowerCase());
        if (distance < closestDistance) {
          closestDistance = distance;
          closestRole = role;
        }
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

async function sendRemovalEmbed(message, targetMember, targetRole) {
  const removalChannelId = "1201153567491358860";
  const removalChannel = message.guild.channels.cache.get(removalChannelId);

  if (!removalChannel) {
    console.error(`Removal channel with ID ${removalChannelId} not found`);
    return;
  }

  const embed = new MessageEmbed()
    .setTitle("Role Removed")
    .setDescription(`A role has been removed from a user.`)
    .addField("User", targetMember.user.tag, true)
    .addField("Role", targetRole.name, true)
    .addField("Moderator", message.author.tag, true)
    .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setColor("#FF0000");

  await removalChannel.send({ embeds: [embed] });
}
