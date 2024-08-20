const { CommandInteraction } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "delete-sticker-emoji",
  description: "Deletes a specific sticker or emoji unless it's sent by authorized users or roles.",
  category: "MODERATION",
  userPermissions: ["ManageMessages"],
  botPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message) {
    const authorizedUserIds = ["1172676427477426302", "387923086730723329"];
    const authorizedRoleIds = ["1251325475049967677", "1228377533968552026"];
    const stickerIdToDelete = "1273105718735671418";
    const emojiIdsToDelete = ["1243674242223181915", "1240415112158908457"];

    // Check if the message contains the specific sticker
    const hasStickerToDelete = message.stickers.has(stickerIdToDelete);

    // Check if the message contains one of the specific emojis
    const hasEmojiToDelete = emojiIdsToDelete.some(emojiId => message.content.includes(`<:FLOW_cc_aoi:${emojiId}>`) || message.content.includes(`<:FLOW_cc_nb:${emojiId}>`));

    // If the message contains neither, return early
    if (!hasStickerToDelete && !hasEmojiToDelete) return;

    // Check if the user is authorized (specific user ID or has specific role)
    const isAuthorizedUser = authorizedUserIds.includes(message.author.id);
    const hasAuthorizedRole = authorizedRoleIds.some(roleId => message.member.roles.cache.has(roleId));

    // If the user is not authorized, delete the message
    if (!isAuthorizedUser && !hasAuthorizedRole) {
      try {
        await message.delete();
        console.log(`Deleted a message with unauthorized sticker/emoji from user ${message.author.tag}`);
      } catch (error) {
        console.error(`Failed to delete message: ${error.message}`);
      }
    }
  }
};
