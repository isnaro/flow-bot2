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
