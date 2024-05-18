const { ApplicationCommandOptionType } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "mute",
  description: "Mutes the specified member",
  category: "MODERATION",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  command: {
    enabled: true,
    aliases: ["bl3"],
    usage: "<ID|@member> <duration> [reason]",
    minArgsCount: 2,
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
        description: "Duration for the mute (e.g., 1d, 1h, 1m)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for mute",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = await message.client.resolveUsers(args[0], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const durationString = args[1];
    const duration = ms(durationString);
    if (!duration) return message.safeReply(`Invalid duration specified: ${args[1]}`);
    const reason = args.slice(2).join(" ") || "No reason provided";

    const response = await mute(message.member, target, reason, duration);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const durationString = interaction.options.getString("duration");
    const duration = ms(durationString);
    if (!duration) return interaction.followUp(`Invalid duration specified: ${durationString}`);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const response = await mute(interaction.member, target, reason, duration);
    await interaction.followUp(response);
  },
};

async function mute(issuer, target, reason, duration) {
  const mutedRoleId = "1232370037843689472";
  const mutedRole = issuer.guild.roles.cache.get(mutedRoleId);

  if (!mutedRole) {
    return "Muted role not found in the server.";
  }

  const member = await issuer.guild.members.fetch(target.id).catch(() => null);
  if (!member) return `User ${target.username} not found in the server.`;

  try {
    await member.roles.add(mutedRole, reason);
    const dmMessage = `### 🤐 You have been muted in **${issuer.guild.name}** for __***${ms(duration, { long: true })}***__ reason: __***${reason}***__ ###

### In case you believe the mute was unfair, you can appeal your mute here: [FLOW Appeal](https://discord.gg/m8F8DwXu) ###`;

    try {
      await target.send(dmMessage);
    } catch (error) {
      console.error(`Failed to send DM to ${target.username}:`, error);
    }

    setTimeout(async () => {
      try {
        await member.roles.remove(mutedRole, "Mute duration expired");
      } catch (error) {
        console.error(`Failed to unmute ${target.username} after temporary mute:`, error);
      }
    }, duration);

    return `${target.username} is muted for ${ms(duration, { long: true })}!`;
  } catch (error) {
    console.error("Error muting user:", error);
    return "Failed to mute the user. Please try again later.";
  }
}