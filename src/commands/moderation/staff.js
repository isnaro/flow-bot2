const { EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "staff",
  description: "Assigns a staff role to a user and announces it to the staff team",
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
    const allowedChannelId = "1273436643172290570";
    const announcementChannelId = "1273436643172290570"; // Channel for welcoming new staff
    const staffRoleId = "1226167494226608198"; // Staff role to assign
    const trialStaffRoleId = "1226166868952350721"; // Trial Staff role for mentions in the announcement

    // Ensure the command is used in the correct channel
    if (message.channel.id !== allowedChannelId) {
      return message.channel.send("This command can only be used in the designated channel.");
    }

    const userIdOrMention = args[0];
    const targetMember = await resolveMember(message, userIdOrMention);
    if (!targetMember) return message.channel.send(`No user found matching ${userIdOrMention}`);

    try {
      // Assign the Staff role to the target member
      await targetMember.roles.add(staffRoleId);

      // Announce the new staff member in the announcement channel
      const announcementChannel = message.guild.channels.cache.get(announcementChannelId);
      if (announcementChannel) {
        const welcomeMessage = `<@&${staffRoleId}> <@&${trialStaffRoleId}> 🎉 Please welcome **<@${targetMember.id}>** to the Staff Team! Let's give them a warm welcome! 👏`;

        await announcementChannel.send({
          content: welcomeMessage,
          allowedMentions: { roles: [staffRoleId, trialStaffRoleId] },
        });
      }

      // Notify success in the command channel
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("Welcome to the Staff Team!")
        .setDescription(`🎉 **${targetMember.user.tag}** has been successfully added to the Staff Team!`)
        .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Staff Role Assigned", iconURL: message.guild.iconURL() });

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Failed to assign staff role: ${error.message}`);
      message.channel.send("An error occurred while adding the user to the staff team.");
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
