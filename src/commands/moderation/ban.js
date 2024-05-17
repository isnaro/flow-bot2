const { banTarget, unbanTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "ban",
  description: "Bans the specified member",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  command: {
    enabled: true,
    usage: "<ID|@member> [duration] [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "duration",
        description: "Duration for the ban (e.g., 1d, 1h, 1m)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "reason",
        description: "Reason for ban",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = await message.client.resolveUsers(args[0], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const duration = ms(args[1]);
    const reason = duration ? args.slice(2).join(" ") : args.slice(1).join(" ");
    const response = await ban(message.member, target, reason || "No reason provided", duration);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const durationString = interaction.options.getString("duration");
    const duration = durationString ? ms(durationString) : null;
    const reason = interaction.options.getString("reason") || "No reason provided";

    const response = await ban(interaction.member, target, reason, duration);
    await interaction.followUp(response);
  },
};

async function ban(issuer, target, reason, duration) {
  try {
    const response = await banTarget(issuer, target, reason);
    if (typeof response === "boolean") {
      let dmMessage = `### 🔴🔴 You were banned from FLOW for __***${reason}***__ ###

### In case you believe the ban was unfair, you can appeal your ban here: https://discord.gg/m8F8DwXu ###`;

      if (duration) {
        const unbanDate = new Date(Date.now() + duration);
        const unbanDateString = unbanDate.toUTCString();
        dmMessage = `### 🔴🔴 You were banned from FLOW for __***${ms(duration, { long: true })}***__ reason : __***${reason}***__ ###

Your ban will be lifted on: ${unbanDateString}

### In case you believe the ban was unfair, you can appeal your ban here: https://discord.gg/m8F8DwXu ###`;
      }

      await target.send(dmMessage).catch(console.error);

      if (duration) {
        setTimeout(async () => {
          try {
            await unbanTarget(issuer.guild, target.id);
          } catch (error) {
            console.error(`Failed to unban ${target.username} after temporary ban:`, error);
          }
        }, duration);
        return `${target.username} is banned for ${ms(duration, { long: true })}! The ban will be lifted on: ${new Date(Date.now() + duration).toUTCString()}`;
      }
      return `${target.username} is banned!`;
    }
    if (response === "BOT_PERM") return `I do not have permission to ban ${target.username}`;
    else if (response === "MEMBER_PERM") return `You do not have permission to ban ${target.username}`;
    else return `Failed to ban ${target.username}`;
  } catch (error) {
    console.error("Error banning user:", error);
    return "Failed to ban the user. Please try again later.";
  }
}
