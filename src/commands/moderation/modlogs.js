<<<<<<< HEAD
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
=======
// src/commands/modlogs.js
const { ApplicationCommandOptionType, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
>>>>>>> parent of 7aba5c8 (Update modlogs.js)
const fs = require('fs');
const path = require('path');

const logsFilePath = path.join(__dirname, '../modlogs.json');

// Utility functions for logging
function getLogs() {
  if (!fs.existsSync(logsFilePath)) {
    fs.writeFileSync(logsFilePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(logsFilePath));
}

/**
 * @type {import('@structures/Command')}
 */
module.exports = {
  name: "modlogs",
  description: "Displays moderation logs for a user",
<<<<<<< HEAD
  category: "MODERATION",
  command: {
    enabled: true,
    usage: "<ID|@member> [page]",
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
        name: "page",
        description: "The page number of logs to display",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    try {
      console.log("messageRun - args:", args);

      if (!hasRequiredRole(message.member)) {
        console.log("messageRun - missing required role");
        return message.safeReply("You do not have the required role to use this command.");
      }

      const target = await message.guild.members.fetch(args[0]).catch(err => {
        console.error("messageRun - error fetching target:", err);
        return null;
      });
      if (!target) {
        console.log("messageRun - target not found:", args[0]);
        return message.safeReply(`No user found matching ${args[0]}`);
      }

      const page = args[1] ? parseInt(args[1]) - 1 : 0;
      const logs = getLogs()[target.user.id] || [];
      console.log("messageRun - logs:", logs);

      await sendModlogEmbed(message, target.user, logs, page);
    } catch (error) {
      console.error("Error in messageRun:", error);
      message.safeReply("An error occurred while running this command.");
=======
  options: [
    {
      name: "user",
      description: "The target member",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  
  async execute(interaction) {
    if (!hasRequiredRole(interaction.member)) {
      return interaction.reply({ content: "You do not have the required role to use this command.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const target = await interaction.guild.members.fetch(user.id);
    const logs = getLogs()[target.user.id] || [];

    await sendModlogEmbed(interaction, target.user, logs, 0);
  },

  async messageRun(message, args) {
    if (!hasRequiredRole(message.member)) {
      return message.safeReply("You do not have the required role to use this command.");
>>>>>>> parent of 7aba5c8 (Update modlogs.js)
    }
  },
<<<<<<< HEAD

  async interactionRun(interaction) {
    try {
      console.log("interactionRun - options:", interaction.options);

      if (!hasRequiredRole(interaction.member)) {
        console.log("interactionRun - missing required role");
        return interaction.followUp("You do not have the required role to use this command.");
      }

      const user = interaction.options.getUser("user");
      const page = interaction.options.getInteger("page") ? interaction.options.getInteger("page") - 1 : 0;
      const target = await interaction.guild.members.fetch(user.id).catch(err => {
        console.error("interactionRun - error fetching target:", err);
        return null;
      });
      if (!target) {
        console.log("interactionRun - target not found:", user.id);
        return interaction.followUp(`No user found matching ${user.id}`);
      }

      const logs = getLogs()[target.user.id] || [];
      console.log("interactionRun - logs:", logs);

      await sendModlogEmbed(interaction, target.user, logs, page);
    } catch (error) {
      console.error("Error in interactionRun:", error);
      interaction.followUp("An error occurred while running this command.");
    }
  },
=======
>>>>>>> parent of 7aba5c8 (Update modlogs.js)
};

function hasRequiredRole(member) {
  const requiredRoles = ["1226166868952350721", "1226167494226608198"];
  const hasRole = requiredRoles.some(role => member.roles.cache.has(role));
  console.log("hasRequiredRole - hasRole:", hasRole);
  return hasRole;
}

async function sendModlogEmbed(context, user, logs, pageIndex) {
  try {
    console.log("sendModlogEmbed - logs:", logs);
    console.log("sendModlogEmbed - pageIndex:", pageIndex);

<<<<<<< HEAD
    if (logs.length === 0) {
      console.log("sendModlogEmbed - no logs found for user:", user.tag);
      return context.reply(`No logs found for ${user.tag}`);
=======
  // Reverse the logs array to display the newest actions first
  const reversedLogs = logs.slice().reverse();

  const itemsPerPage = 5;
  const totalPages = Math.ceil(reversedLogs.length / itemsPerPage);

  const embed = new MessageEmbed()
    .setAuthor(`Moderation Logs for ${user.tag}`, user.displayAvatarURL())
    .setColor("#FF0000")
    .setThumbnail(user.displayAvatarURL())
    .setFooter(`Page ${pageIndex + 1} of ${totalPages}`);

  const start = pageIndex * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = reversedLogs.slice(start, end);

  pageItems.forEach((log, index) => {
    const actionNumber = start + index + 1;
    embed.addFields(
      { name: `Action #${actionNumber}`, value: log.type, inline: true },
      { name: "Reason", value: log.reason, inline: true },
      { name: "Date", value: new Date(log.date).toLocaleString(), inline: true },
      { name: "Responsible Moderator", value: `${log.issuer} (${log.issuerId})`, inline: false }
    );
    embed.addFields({ name: '\u200B', value: '\u200B' });
  });

  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('prev')
        .setLabel('Previous')
        .setStyle('PRIMARY')
        .setDisabled(pageIndex === 0),
      new MessageButton()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle('PRIMARY')
        .setDisabled(pageIndex === totalPages - 1)
    );

  const messageOptions = { embeds: [embed], components: [row] };

  if (context.deferred || context.replied) {
    await context.editReply(messageOptions);
  } else {
    await context.reply(messageOptions);
  }

  const filter = i => i.user.id === context.user.id && (i.customId === 'prev' || i.customId === 'next');
  const collector = context.channel.createMessageComponentCollector({
    filter,
    componentType: 'BUTTON',
    time: 60000,
  });

  collector.on('collect', async i => {
    if (i.customId === 'prev' && pageIndex > 0) {
      pageIndex--;
    } else if (i.customId === 'next' && pageIndex < totalPages - 1) {
      pageIndex++;
>>>>>>> parent of 7aba5c8 (Update modlogs.js)
    }

    const itemsPerPage = 5;
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    if (pageIndex >= totalPages) pageIndex = totalPages - 1;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Moderation Logs for ${user.tag}`, iconURL: user.displayAvatarURL() })
      .setColor("#FF0000")
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages}` });

    const start = pageIndex * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = logs.slice(start, end);
    console.log("sendModlogEmbed - pageItems:", pageItems);

    pageItems.forEach((log, index) => {
      embed.addFields(
        { name: `Action ${start + index + 1}`, value: log.type, inline: true },
        { name: "Reason", value: log.reason, inline: true },
        { name: "Date", value: new Date(log.date).toLocaleString(), inline: true },
        { name: "Issuer", value: log.issuer, inline: true }
      );
    });

    await context.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in sendModlogEmbed:", error);
    console.log("Logs causing error:", logs);
    context.reply("An error occurred while generating the modlog embed.");
  }
}
