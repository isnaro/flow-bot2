const { warnTarget, timeoutTarget, banTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "warn",
  description: "warns the specified member",
  category: "MODERATION",
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    usage: "<ID|@member> [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "the target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "reason for warn",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = args.slice(1).join(" ") || "No reason provided";
    const response = await warn(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id);

    const response = await warn(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function warn(issuer, target, reason) {
  try {
    const response = await warnTarget(issuer, target, reason);
    if (typeof response === "boolean") {
      try {
        await target.send(
          `## ⚠️⚠️ You have been warned in FLOW for : ***${reason}*** ##

### Please follow the server rules <#1200477076113850468> to avoid further actions. ###`
        );
      } catch (err) {
        console.error(`Failed to send DM to ${target.user.username}:`, err);
      }
      return `${target.user.username} has been warned!`;
    }
    switch (response) {
      case "BOT_PERM":
        return `I do not have permission to warn ${target.user.username}`;
      case "MEMBER_PERM":
        return `You do not have permission to warn ${target.user.username}`;
      default:
        return `Failed to warn ${target.user.username}`;
    }
  } catch (error) {
    console.error("Error warning user:", error);
    return "Failed to warn the user. Please try again later.";
  }
}

// Automate Actions After Reaching Certain Number of Warnings
const WARN_THRESHOLD_1 = 4;
const WARN_THRESHOLD_2 = 7;
const WARN_THRESHOLD_3 = 10;

async function warnTargetWithAutoActions(issuer, target, reason) {
  const warnResponse = await warnTarget(issuer, target, reason);

  if (typeof warnResponse === "boolean") {
    const memberDb = await getMember(target.guild.id, target.id);
    const warnings = memberDb.warnings + 1;

    // Apply timeout after 4th warning
    if (warnings === WARN_THRESHOLD_1) {
      const timeoutDuration = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
      await timeoutTarget(issuer, target, timeoutDuration, `Auto Timeout after ${WARN_THRESHOLD_1} warnings`);
    }
    // Apply tempban after 7th warning
    else if (warnings === WARN_THRESHOLD_2) {
      const tempbanDuration = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
      await tempbanTarget(issuer, target, tempbanDuration, `Auto Tempban after ${WARN_THRESHOLD_2} warnings`);
    }
    // Apply permanent ban after 10th warning
    else if (warnings === WARN_THRESHOLD_3) {
      await banTarget(issuer, target, `Auto Permanent Ban after ${WARN_THRESHOLD_3} warnings`);
    }

    // Update warnings count
    memberDb.warnings = warnings;
    await memberDb.save();

    return true;
  } else {
    return warnResponse;
  }
}
