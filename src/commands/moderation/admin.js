const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "admin",
  description: "Sets up admin role permissions for all channels",
  category: "MODERATION",
  command: {
    enabled: true,
    usage: "<role-id>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    // Check if the user is the owner of the server
    if (message.guild.ownerId !== message.member.id) {
      return message.safeReply("Only the server owner can use this command.");
    }

    const roleId = args[0];
    const role = message.guild.roles.cache.get(roleId);
    if (!role) return message.safeReply("Role not found. Please provide a valid role ID.");

    // Apply all permissions to all channels
    const channels = message.guild.channels.cache;
    channels.forEach(channel => {
      channel.permissionOverwrites.edit(role, {
        VIEW_CHANNEL: true,
        MANAGE_CHANNELS: true,
        MANAGE_ROLES: true,
        MANAGE_WEBHOOKS: true,
        CREATE_INSTANT_INVITE: true,
        SEND_MESSAGES: true,
        SEND_TTS_MESSAGES: true,
        MANAGE_MESSAGES: true,
        EMBED_LINKS: true,
        ATTACH_FILES: true,
        READ_MESSAGE_HISTORY: true,
        MENTION_EVERYONE: true,
        USE_EXTERNAL_EMOJIS: true,
        ADD_REACTIONS: true,
        CONNECT: true,
        SPEAK: true,
        STREAM: true,
        MUTE_MEMBERS: true,
        DEAFEN_MEMBERS: true,
        MOVE_MEMBERS: true,
        USE_VAD: true,
        PRIORITY_SPEAKER: true,
        MANAGE_EVENTS: true,
        MANAGE_THREADS: true,
        USE_PUBLIC_THREADS: true,
        USE_PRIVATE_THREADS: true,
        USE_EXTERNAL_STICKERS: true,
        SEND_MESSAGES_IN_THREADS: true,
        START_EMBEDDED_ACTIVITIES: true,
      }).catch(error => console.error(`Failed to edit permissions for channel ${channel.name}:`, error));
    });

    await message.safeReply(`All permissions have been updated for the role <@&${roleId}> on all channels.`);
  },
};
