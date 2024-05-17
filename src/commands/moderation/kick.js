const { kickTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "kick",
  description: "kicks the specified member",
  category: "MODERATION",
  botPermissions: ["KickMembers"],
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
        description: "reason for kick",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = args.slice(1).join(" ").trim() || "No reason provided";
    const response = await kick(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id);

    const response = await kick(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function kick(issuer, target, reason) {
  try {
    const dmMessage = `## ⚠️⚠️ You have been KICKED from FLOW for : ***${reason}*** ##

### Please follow the server rules <#1200477076113850468> to avoid further actions. ###`;
    
    try {
      await target.send(dmMessage);
    } catch (err) {
      console.error(`Failed to send DM to ${target.user.username}:`, err);
    }

    setTimeout(async () => {
      const response = await kickTarget(issuer, target, reason);
      if (typeof response === "boolean") {
        return `${target.user.username} is kicked!`;
      }
      switch (response) {
        case "BOT_PERM":
          return `I do not have permission to kick ${target.user.username}`;
        case "MEMBER_PERM":
          return `You do not have permission to kick ${target.user.username}`;
        default:
          return `Failed to kick ${target.user.username}`;
      }
    }, 2000);  // 2-second delay
    
  } catch (error) {
    console.error("Error kicking user:", error);
    return "Failed to kick the user. Please try again later.";
  }
}