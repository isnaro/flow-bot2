const { EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "promote",
  description: "Promotes a user to the next role in the staff hierarchy",
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
    
    // Check if the command is being run in the allowed channel
    if (message.channel.id !== allowedChannelId) {
      return message.channel.send("This command can only be used in the designated channel.");
    }

    const trialStaffRoleId = "1226166868952350721";
    const staffRoleId = "1226167494226608198";
    const assistantRoleId = "1240403515340492870";
    const moderatorRoleId = "1200492206520287342";
    const managerRoleId = "1226166523136180276";
    const globalManagerRoleId = "1200477902387544185";
    const administratorRoleId = "1200477300093878385";

    const staffChannelId = "staff-channel-id"; // Replace with your actual staff channel ID
    const trialStaffChannelId = "trial-staff-channel-id"; // Replace with your actual trial staff channel ID

    const userIdOrMention = args[0];
    const targetMember = await resolveMember(message, userIdOrMention);
    if (!targetMember) return message.channel.send(`No user found matching ${userIdOrMention}`);

    let newRoleId;
    let removedRoleId;

    if (targetMember.roles.cache.has(trialStaffRoleId)) {
      newRoleId = [staffRoleId, assistantRoleId];
      removedRoleId = trialStaffRoleId;
    } else if (targetMember.roles.cache.has(assistantRoleId)) {
      newRoleId = [moderatorRoleId];
      removedRoleId = assistantRoleId;
    } else if (targetMember.roles.cache.has(moderatorRoleId)) {
      newRoleId = [managerRoleId];
      removedRoleId = moderatorRoleId;
    } else if (targetMember.roles.cache.has(managerRoleId)) {
      newRoleId = [globalManagerRoleId];
      removedRoleId = managerRoleId;
    } else if (targetMember.roles.cache.has(globalManagerRoleId)) {
      newRoleId = [administratorRoleId];
      removedRoleId = globalManagerRoleId;
    } else {
      return message.channel.send("The user does not have a role that can be promoted.");
    }

    try {
      if (removedRoleId) {
        await targetMember.roles.remove(removedRoleId);
      }
      if (newRoleId) {
        await targetMember.roles.add(newRoleId);
      }

      // Get the user's nickname or username if no nickname is set
      const nickname = targetMember.nickname || targetMember.user.username;

      // Send a congratulatory message
      const embed = new EmbedBuilder()
        .setTitle("🎉 Promotion!")
        .setDescription(`Congrats <@${targetMember.id}> on your promotion to <@&${newRoleId[0]}>! Keep up the great work, **${nickname}**!`)
        .setColor(0x00FF00) // Use a hexadecimal color value
        .setTimestamp();

      const staffChannel = message.guild.channels.cache.get(staffChannelId);
      const trialStaffChannel = message.guild.channels.cache.get(trialStaffChannelId);

      const congratsMessage = `<@&${staffRoleId}> <@&${trialStaffRoleId}> Congrats <@${targetMember.id}> for their promotion to <@&${newRoleId[0]}>! Keep it up, **${nickname}**! 🎉`;

      if (staffChannel) {
        await staffChannel.send({ content: congratsMessage, embeds: [embed] });
      }
      if (trialStaffChannel) {
        await trialStaffChannel.send({ content: congratsMessage, embeds: [embed] });
      }

      const botReply = await message.channel.send(congratsMessage);

      // Auto-react with specified emojis
      const emojiIds = [
        "1228953695891357727", // nb_white_hearts
        "1231070540312219728", // nb_whitesparkles
        "1275965432695623742", // FLOW_congrats
      ];
      for (const emojiId of emojiIds) {
        await botReply.react(emojiId);
      }
    } catch (error) {
      console.error(`Failed to promote user: ${error.message}`);
      message.channel.send("An error occurred while trying to promote the user.");
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
