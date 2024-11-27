const { EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "retire",
  description: "Removes all moderation roles from a user and assigns the Retired Staff role",
  category: "MODERATION",
  userPermissions: ["Administrator"], // Requires the user to be an administrator
  botPermissions: ["ManageRoles"],
  command: {
    enabled: true,
    usage: "<user-id|@user>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const allowedChannelId = "1275958005396934741";
    const announcementChannelId = "1273436643172290570"; // Channel where the retirement announcement is sent
    const trialStaffRoleId = "1226166868952350721"; // Trial Staff role
    const staffRoleId = "1226167494226608198"; // Staff role

    // Ensure the command is used in the correct channel
    if (message.channel.id !== allowedChannelId) {
      return message.channel.send("This command can only be used in the designated channel.");
    }

    // Moderation roles to be removed
    const moderationRoles = [
      "1226166868952350721", // Trial Staff
      "1226167494226608198", // Staff
      "1240403515340492870", // Assistant
      "1200492206520287342", // Moderator
      "1226166523136180276", // Manager
      "1200477902387544185", // Global Manager
      "1200477300093878385", // Administrator
      "1254606914462023760", // Additional Moderation Role 1
      "1232680926459203644", // Additional Moderation Role 2
      "1200492632468627466", // Additional Moderation Role 3
      "1200492746692120747", // Additional Moderation Role 4
      "1225817692536311828", // Additional Moderation Role 5
      "1200492785040629880", // Additional Moderation Role 6
    ];

    // Retired Staff role
    const retiredStaffRoleId = "1231027781790335067";

    const userIdOrMention = args[0];
    const targetMember = await resolveMember(message, userIdOrMention);
    if (!targetMember) return message.channel.send(`No user found matching ${userIdOrMention}`);

    try {
      // Remove all moderation roles
      const rolesToRemove = targetMember.roles.cache.filter((role) => moderationRoles.includes(role.id));
      await targetMember.roles.remove(rolesToRemove);

      // Assign the Retired Staff role
      await targetMember.roles.add(retiredStaffRoleId);

      // Send retirement announcement in the specified channel
      const announcementChannel = message.guild.channels.cache.get(announcementChannelId);
      if (announcementChannel) {
        const announcementMessage = `<@&${staffRoleId}> <@&${trialStaffRoleId}> 🚨 **${targetMember.user.tag}** has left the staff team. Thank you for your contributions! 🫡`;
        await announcementChannel.send({
          content: announcementMessage,
          allowedMentions: { roles: [staffRoleId, trialStaffRoleId] },
        });
      }

      // Notify success in the command channel
      const embed = new EmbedBuilder()
        .setColor(0xffc107)
        .setTitle("Retirement Announcement")
        .setDescription(`🎉 **${targetMember.user.tag}** has retired from their staff duties and is now a **Retired Staff**. Thank you for your service!`)
        .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Retired Staff", iconURL: message.guild.iconURL() });

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Failed to retire user: ${error.message}`);
      message.channel.send("An error occurred while processing the retirement.");
    }
  },
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
