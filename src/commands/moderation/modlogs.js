const Discord = require("discord.js");
const { modLogDb } = require("./moderationDatabase"); // Replace with your database handling module

module.exports = {
  name: "modlogs",
  aliases: ["ml"],
  description: "View moderation log for a user",
  category: "MODERATION",
  botPermissions: ["EMBED_LINKS"],
  command: {
    enabled: true,
    usage: "<@user/user-id>",
    minArgsCount: 1,
  },
  async messageRun(message, args) {
    const userId = getUserId(args[0]);

    // Check if the user has the required role
    if (!message.member.roles.cache.has("1226167494226608198")) {
      return message.safeReply("You do not have permission to use this command.");
    }

    const modActions = await getModActions(userId);
    if (modActions.length === 0) {
      return message.safeReply("No moderation actions found for this user.");
    }

    const user = message.guild.members.cache.get(userId);
    const userName = user ? user.displayName : userId;

    const embed = new Discord.MessageEmbed()
      .setColor("#ff0000")
      .setTitle(`Moderation Log for ${userName}`)
      .setDescription("Here are the moderation actions for this user:");

    modActions.forEach(action => {
      embed.addField(
        `${action.type} | ${new Date(action.timestamp).toLocaleDateString()}`,
        `Responsible moderator: ${action.modName}\nReason: ${action.reason}`
      );
    });

    message.safeSend({ embeds: [embed] });
  },
};

// Function to get user ID from mention or ID string
function getUserId(input) {
  const userIdRegex = /<@!?(\d+)>/;
  const match = userIdRegex.exec(input);
  return match ? match[1] : input;
}

// Function to fetch moderation actions from database
async function getModActions(userId) {
  try {
    // Fetch moderation actions from your database
    const actions = await modLogDb.getModActions(userId);
    return actions;
  } catch (error) {
    console.error("Error fetching moderation actions:", error);
    return [];
  }
}


// Initialize an empty map to store moderation logs
const moderationLogs = new Map();

/**
 * Function to log a moderation action
 * @param {string} userId - The ID of the user being moderated
 * @param {string} modId - The ID of the moderator performing the action
 * @param {string} modName - The username of the moderator performing the action
 * @param {string} actionType - The type of moderation action (e.g., "MUTE", "KICK")
 * @param {string} reason - The reason for the moderation action
 */
function logModAction(userId, modId, modName, actionType, reason) {
  const timestamp = new Date().toISOString();
  const logEntry = { userId, modId, modName, actionType, reason, timestamp };
  
  // Append the log entry to the user's log array
  if (moderationLogs.has(userId)) {
    moderationLogs.get(userId).push(logEntry);
  } else {
    moderationLogs.set(userId, [logEntry]);
  }
}

/**
 * Function to get moderation actions for a user
 * @param {string} userId - The ID of the user to retrieve moderation logs for
 * @returns {Array} - An array of moderation log entries for the user
 */
function getModActions(userId) {
  return moderationLogs.get(userId) || [];
}

module.exports = { logModAction, getModActions };
