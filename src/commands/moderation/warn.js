const { warnTarget, timeoutTarget, kickTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

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
      const warnEmbed = new EmbedBuilder()
        .setTitle("⚠️ You have been warned in FLOW")
        .setDescription(`**Reason:** ${reason}`)
        .addFields(
          { name: "Next Steps", value: "Please follow <#1200477076113850468> to avoid further actions." },
          { name: "Appeal Process", value: "If you believe the warn was unfair, create a ticket through <#1200479692927549640> or visit [FLOW Appeal](https://discord.gg/kJFuMk6ZFS)." }
        )
        .setColor("YELLOW")
        .setTimestamp();

      try {
        await target.send({ embeds: [warnEmbed] });
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
const WARN_THRESHOLD_1 = 3;
const WARN_THRESHOLD_2 = 4;

async function warnTargetWithAutoActions(issuer, target, reason) {
  const warnResponse = await warnTarget(issuer, target, reason);

  if (typeof warnResponse === "boolean") {
    const memberDb = await getMember(target.guild.id, target.id);
    const warnings = memberDb.warnings + 1;

    // Apply timeout after 3rd warning
    if (warnings === WARN_THRESHOLD_1) {
      const timeoutDuration = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
      await timeoutTarget(issuer, target, timeoutDuration, `Auto Timeout after ${WARN_THRESHOLD_1} warnings`);

      // Send DM after timeout
      setTimeout(async () => {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⌛ Your timeout in FLOW has ended")
          .setDescription("You are now able to rejoin the server and participate again.")
          .setColor("GREEN")
          .setTimestamp();

        try {
          await target.send({ embeds: [timeoutEmbed] });
        } catch (err) {
          console.error(`Failed to send DM to ${target.user.username}:`, err);
        }
      }, timeoutDuration);
    }

    // Kick member after 4th warning
    if (warnings === WARN_THRESHOLD_2) {
      await kickTarget(issuer, target, "Auto Kick after reaching 4 warnings");
      return true;
    }

    // Update warnings count
    memberDb.warnings = warnings;
    await memberDb.save();

    return true;
  } else {
    return warnResponse;
  }
}

async function warnTarget(issuer, target, reason) {
  // Assuming this function already exists and handles the logic for issuing a warning
}

async function getMember(guildId, memberId) {
  // Assuming this function fetches the member data from the database
}

async function timeoutTarget(issuer, target, duration, reason) {
  // Assuming this function handles the logic for applying a timeout to a member
}

async function kickTarget(issuer, target, reason) {
  // Assuming this function handles the logic for kicking a member from the server
}