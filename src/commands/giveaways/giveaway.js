const { ApplicationCommandOptionType, EmbedBuilder, Client, Intents } = require("discord.js");
const { setTimeout } = require("timers/promises");

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS] });

// Register your slash command when the client is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const guild = client.guilds.cache.get('YOUR_GUILD_ID'); // Replace with your guild ID
  if (guild) {
    guild.commands.create({
      name: 'giveaway',
      description: 'Starts a new giveaway',
      options: [
        {
          name: 'channel',
          description: 'The channel to post the giveaway in',
          type: ApplicationCommandOptionType.CHANNEL,
          required: true,
        },
        {
          name: 'name',
          description: 'The name of the giveaway',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'duration',
          description: 'Duration of the giveaway (e.g., 1h, 30m, 1d)',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'winners',
          description: 'Number of winners',
          type: ApplicationCommandOptionType.INTEGER,
          required: true,
        },
        {
          name: 'description',
          description: 'Description of the giveaway',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'image',
          description: 'Image URL for the giveaway',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'roles',
          description: 'Roles allowed to participate',
          type: ApplicationCommandOptionType.ROLE,
          required: false,
        },
      ],
    });
  }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'giveaway') {
    const requiredRole = '1232680926459203644'; // Replace with your required role ID
    if (!interaction.member.roles.cache.has(requiredRole)) {
      return interaction.reply("You do not have the required role to use this command.");
    }

    try {
      const channel = interaction.options.getChannel('channel');
      const name = interaction.options.getString('name');
      const duration = interaction.options.getString('duration');
      const winners = interaction.options.getInteger('winners');
      const description = interaction.options.getString('description');
      const image = interaction.options.getString('image');
      const roles = interaction.options.getRole('roles') ? [interaction.options.getRole('roles')] : [];

      console.log("Extracted values:", {
        channel: channel.name,
        name,
        duration,
        winners,
        description,
        image,
        roles: roles.map(role => role.name),
      });

      const response = await startGiveaway(channel, name, duration, winners, description, image, roles);
      await interaction.reply(response);
    } catch (err) {
      console.error("Error in interactionCreate:", err);
      interaction.reply("An error occurred while running this command.");
    }
  }
});

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

// Login to Discord with your client's token
client.login('YOUR_BOT_TOKEN'); // Replace with your bot's token
