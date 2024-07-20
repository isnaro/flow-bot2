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

    // Permissions to be granted
    const permissions = [
      PermissionsBitField.Flags.ManageRoles,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.MoveMembers,
      PermissionsBitField.Flags.MuteMembers,
      PermissionsBitField.Flags.DeafenMembers,
      PermissionsBitField.Flags.ManageWebhooks,
      PermissionsBitField.Flags.CreateInstantInvite,
      PermissionsBitField.Flags.SendTTSMessages,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.MentionEveryone,
      PermissionsBitField.Flags.UseExternalEmojis,
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.Stream,
      PermissionsBitField.Flags.UseVAD,
      PermissionsBitField.Flags.PrioritySpeaker,
      PermissionsBitField.Flags.ManageEvents,
      PermissionsBitField.Flags.ManageThreads,
      PermissionsBitField.Flags.UsePublicThreads,
      PermissionsBitField.Flags.UsePrivateThreads,
      PermissionsBitField.Flags.UseExternalStickers,
      PermissionsBitField.Flags.SendMessagesInThreads,
      PermissionsBitField.Flags.StartEmbeddedActivities,
    ];

    // Apply permissions to all channels
    const channels = message.guild.channels.cache;
    channels.forEach(channel => {
      const permissionObject = {};
      permissions.forEach(permission => {
        permissionObject[permission] = true;
      });

      channel.permissionOverwrites.edit(role, permissionObject)
        .catch(error => console.error(`Failed to edit permissions for channel ${channel.name}:`, error));
    });

    await message.safeReply(`Permissions have been updated for the role <@&${roleId}> on all channels.`);
  },
};
