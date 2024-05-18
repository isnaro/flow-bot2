const { ApplicationCommandOptionType, MessageEmbed } = require("discord.js");
const ms = require("ms");

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
  console.log("Retrieving moderation actions for user:", userId);
  return moderationLogs.get(userId) || [];
}

module.exports = {
  name: "modlogs",
  description: "View moderation logs for a user",
  category: "MODERATION",
  userPermissions: [],
  botPermissions: [],
  command: {
    enabled: true,
    aliases: ["ml"],
    usage: "<@user/user-id>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to view moderation logs for",
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const userId = message.mentions.users.first()?.id || args[0];
    const modActions = getModActions(userId);
    console.log("Retrieved moderation actions:", modActions);
    if (!modActions.length) return message.safeReply("No moderation actions found for this user.");

    const embed = createModLogEmbed(message.guild, userId, modActions);
    message.safeSend({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const userId = interaction.options.getUser("user").id;
    const modActions = getModActions(userId);
    console.log("Retrieved moderation actions:", modActions);
    if (!modActions.length) return interaction.reply("No moderation actions found for this user.");

    const embed = createModLogEmbed(interaction.guild, userId, modActions);
    interaction.reply({ embeds: [embed] });
  },
};

/**
 * Function to create an embed for moderation logs
 * @param {import('discord.js').Guild} guild - The guild object
 * @param {string} userId - The ID of the user
 * @param {Array} modActions - An array of moderation log entries for the user
 * @returns {import('discord.js').MessageEmbed} - The embed object
 */
function createModLogEmbed(guild, userId, modActions) {
  const user = guild.members.cache.get(userId)?.user || { tag: "Unknown User" };
  const embed = new MessageEmbed()
    .setTitle("Moderation Logs")
    .setDescription(`Moderation actions for ${user.tag} (${userId})`);

  modActions.forEach((action, index) => {
    embed.addField(`Action ${index + 1}`, `
      **Type:** ${action.actionType}
      **Moderator:** <@${action.modId}> (${action.modName})
      **Reason:** ${action.reason}
      **Timestamp:** ${new Date(action.timestamp).toLocaleString()}
    `);
  });

  return embed;
}
