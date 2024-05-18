const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { setTimeout } = require("timers/promises");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "giveaway",
  description: "Starts a new giveaway",
  category: "UTILITY",
  botPermissions: ["SendMessages", "EmbedLinks", "AddReactions"],
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<channel> <name> <duration> <winners> [description] [image] [roles...]",
    minArgsCount: 4,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "channel",
        description: "The channel to post the giveaway in",
        type: ApplicationCommandOptionType.Channel,
        required: true,
      },
      {
        name: "name",
        description: "The name of the giveaway",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "duration",
        description: "Duration of the giveaway (e.g., 1h, 30m, 1d)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "winners",
        description: "Number of winners",
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
      {
        name: "description",
        description: "Description of the giveaway",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "image",
        description: "Image URL for the giveaway",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "roles",
        description: "Roles allowed to participate",
        type: ApplicationCommandOptionType.Role,
        required: false,
        multi: true,
      },
    ],
  },

  async messageRun(message, args) {
    const [channelId, name, duration, winners, ...rest] = args;
    const channel = message.guild.channels.cache.get(channelId.replace(/[<#>]/g, ""));
    if (!channel) return message.safeReply("Invalid channel.");

    const description = rest.join(" ").match(/"([^"]+)"/)?.[1];
    const image = rest.join(" ").match(/(https?:\/\/[^\s]+)/)?.[0];
    const rolesString = rest.join(" ").replace(description, "").replace(image, "").trim();
    const roles = rolesString ? rolesString.split(" ").map(r => message.guild.roles.cache.get(r.replace(/[<@&>]/g, ""))) : [];

    const response = await startGiveaway(channel, name, duration, winners, description, image, roles);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const channel = interaction.options.getChannel("channel");
    const name = interaction.options.getString("name");
    const duration = interaction.options.getString("duration");
    const winners = interaction.options.getInteger("winners");
    const description = interaction.options.getString("description");
    const image = interaction.options.getString("image");
    const roles = interaction.options.getRole("roles") ? interaction.options.getRole("roles").map(r => interaction.guild.roles.cache.get(r.id)) : [];

    const response = await startGiveaway(channel, name, duration, winners, description, image, roles);
    await interaction.followUp(response);
  },
};

async function startGiveaway(channel, name, duration, winners, description, image, roles) {
  try {
    // Convert duration to milliseconds
    const durationMs = parseDuration(duration);
    if (!durationMs) return "Invalid duration format.";

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle(name)
      .setDescription(description || "No description provided")
      .setImage(image || null)
      .setFooter({ text: `Ends in ${duration}` })
      .setTimestamp(Date.now() + durationMs);

    // Send the embed and add a reaction
    const giveawayMessage = await channel.send({ embeds: [embed] });
    await giveawayMessage.react("🎉");

    // Wait for the giveaway to end
    await setTimeout(durationMs);

    // Fetch the message again to get the latest reactions
    const updatedMessage = await channel.messages.fetch(giveawayMessage.id);
    const reactions = updatedMessage.reactions.cache.get("🎉");

    if (!reactions) return "No one participated in the giveaway.";

    // Filter reactions by allowed roles
    const participants = await reactions.users.fetch();
    const filteredParticipants = participants.filter(user => {
      if (user.bot) return false;
      if (roles.length === 0) return true;
      const member = channel.guild.members.cache.get(user.id);
      return roles.some(role => member.roles.cache.has(role.id));
    });

    if (filteredParticipants.size === 0) return "No eligible participants found for the giveaway.";

    // Pick winners
    const winnerArray = filteredParticipants.random(winners);
    const winnersMention = winnerArray.map(w => `<@${w.id}>`).join(", ");

    // Announce the winners in the channel
    await channel.send(`Congratulations ${winnersMention}, you won the **${name}** giveaway! 🎉`);

    // Send a DM to each winner
    for (const winner of winnerArray) {
      try {
        await winner.send(`Congratulations! You have won the **${name}** giveaway in ${channel.guild.name}. 🎉`);
      } catch (err) {
        console.error(`Could not send DM to ${winner.tag}.`);
      }
    }

    return `Giveaway ended. Winners: ${winnersMention}`;
  } catch (err) {
    console.error(err);
    return "An error occurred while starting the giveaway.";
  }
}

function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value * 1000; // seconds to milliseconds
    case 'm':
      return value * 60 * 1000; // minutes to milliseconds
    case 'h':
      return value * 60 * 60 * 1000; // hours to milliseconds
    case 'd':
      return value * 24 * 60 * 60 * 1000; // days to milliseconds
    default:
      return null;
  }
}