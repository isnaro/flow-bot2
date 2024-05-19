const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { setTimeout } = require("timers/promises");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "giveaway",
  description: "Starts a new giveaway",
  category: "UTILITY",
  botPermissions: ["SendMessages", "EmbedLinks", "AddReactions"],
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
    const requiredRole = "1232680926459203644";
    if (!message.member.roles.cache.has(requiredRole)) {
      return message.safeReply("You do not have the required role to use this command.");
    }

    try {
      const [channelId, name, duration, winners, ...rest] = args;
      const channel = message.guild.channels.cache.get(channelId.replace(/[<#>]/g, ""));
      if (!channel) return message.safeReply("Invalid channel.");

      let description = null, image = null;
      const roles = [];

      let restString = rest.join(" ");

      const descriptionMatch = restString.match(/"([^"]+)"/);
      if (descriptionMatch) {
        description = descriptionMatch[1];
        restString = restString.replace(descriptionMatch[0], "").trim();
      }

      const imageMatch = restString.match(/(https?:\/\/[^\s]+)/);
      if (imageMatch) {
        image = imageMatch[0];
        restString = restString.replace(imageMatch[0], "").trim();
      }

      const roleMatches = restString.match(/<@&\d+>/g) || [];
      roleMatches.forEach(roleStr => {
        const roleId = roleStr.replace(/[<@&>]/g, "");
        const role = message.guild.roles.cache.get(roleId);
        if (role) roles.push(role);
      });

      console.log({
        channel: channel.name,
        name,
        duration,
        winners,
        description,
        image,
        roles: roles.map(role => role.name),
      });

      const response = await startGiveaway(channel, name, duration, winners, description, image, roles);
      await message.safeReply(response);
    } catch (err) {
      console.error("Error in messageRun:", err);
      message.safeReply("An error occurred while running this command.");
    }
  },

  async interactionRun(interaction) {
    const requiredRole = "1232680926459203644";
    if (!interaction.member.roles.cache.has(requiredRole)) {
      return interaction.followUp("You do not have the required role to use this command.");
    }

    try {
      const channel = interaction.options.getChannel("channel");
      const name = interaction.options.getString("name");
      const duration = interaction.options.getString("duration");
      const winners = interaction.options.getInteger("winners");
      const description = interaction.options.getString("description");
      const image = interaction.options.getString("image");
      const roles = interaction.options.getRole("roles") ? interaction.options.getRole("roles").map(r => interaction.guild.roles.cache.get(r.id)) : [];

      console.log({
        channel: channel.name,
        name,
        duration,
        winners,
        description,
        image,
        roles: roles.map(role => role.name),
      });

      const response = await startGiveaway(channel, name, duration, winners, description, image, roles);
      await interaction.followUp(response);
    } catch (err) {
      console.error("Error in interactionRun:", err);
      interaction.followUp("An error occurred while running this command.");
    }
  },
};

async function startGiveaway(channel, name, duration, winners, description, image, roles) {
  try {
    console.log("startGiveaway called with arguments:", {
      channel: channel.name,
      name,
      duration,
      winners,
      description,
      image,
      roles: roles.map(role => role.name),
    });

    const durationMs = parseDuration(duration);
    if (!durationMs) return "Invalid duration format.";

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setDescription(description || "No description provided")
      .setImage(image || null)
      .setFooter({ text: `Ends in ${duration}` })
      .setTimestamp(Date.now() + durationMs);

    const giveawayMessage = await channel.send({ embeds: [embed] });
    await giveawayMessage.react("🎉");

    await setTimeout(durationMs);

    const updatedMessage = await channel.messages.fetch(giveawayMessage.id);
    const reactions = updatedMessage.reactions.cache.get("🎉");

    if (!reactions) return "No one participated in the giveaway.";

    const participants = await reactions.users.fetch();
    const filteredParticipants = participants.filter(user => {
      if (user.bot) return false;
      if (roles.length === 0) return true;
      const member = channel.guild.members.cache.get(user.id);
      return roles.some(role => member.roles.cache.has(role.id));
    });

    if (filteredParticipants.size === 0) return "No eligible participants found for the giveaway.";

    const winnerArray = filteredParticipants.random(winners);
    const winnersMention = winnerArray.map(w => `<@${w.id}>`).join(", ");

    await channel.send(`Congratulations ${winnersMention}, you won the **${name}** giveaway! 🎉`);

    for (const winner of winnerArray) {
      try {
        await winner.send(`Congratulations! You have won the **${name}** giveaway in ${channel.guild.name}. 🎉`);
      } catch (err) {
        console.error(`Could not send DM to ${winner.tag}.`);
      }
    }

    return `Giveaway ended. Winners: ${winnersMention}`;
  } catch (err) {
    console.error("Error in startGiveaway:", err);
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
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
