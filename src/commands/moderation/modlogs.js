const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const fs = require('fs');
const path = require('path');

const logsFilePath = path.join(__dirname, 'modlogs.json');

function getLogs() {
  if (!fs.existsSync(logsFilePath)) {
    fs.writeFileSync(logsFilePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(logsFilePath));
}

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "modlogs",
  description: "Displays moderation logs for a user",
  category: "MODERATION",
  command: {
    enabled: true,
    usage: "<ID|@member>",
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
    ],
  },

  async messageRun(message, args) {
    try {
      console.log("messageRun invoked with args:", args);

      if (!hasRequiredRole(message.member)) {
        return message.safeReply("You do not have the required role to use this command.");
      }

      const target = await message.guild.members.fetch(args[0]).catch(error => {
        console.error("Error fetching member:", error);
        return null;
      });
      if (!target) return message.safeReply(`No user found matching ${args[0]}`);
      const logs = getLogs()[target.user.id] || [];
      console.log("Fetched logs for user:", logs);
      await sendModlogEmbed(message, target.user, logs, 0);
    } catch (error) {
      console.error("Error in messageRun:", error);
      message.safeReply("An error occurred while running this command.");
    }
  },

  async interactionRun(interaction) {
    try {
      console.log("interactionRun invoked with options:", interaction.options);

      if (!hasRequiredRole(interaction.member)) {
        return interaction.followUp("You do not have the required role to use this command.");
      }

      const user = interaction.options.getUser("user");
      const target = await interaction.guild.members.fetch(user.id).catch(error => {
        console.error("Error fetching member:", error);
        return null;
      });
      if (!target) return interaction.followUp(`No user found matching ${user.id}`);
      const logs = getLogs()[target.user.id] || [];
      console.log("Fetched logs for user:", logs);
      await sendModlogEmbed(interaction, target.user, logs, 0);
    } catch (error) {
      console.error("Error in interactionRun:", error);
      interaction.followUp("An error occurred while running this command.");
    }
  },
};

function hasRequiredRole(member) {
  const requiredRoles = ["1226166868952350721", "1226167494226608198"];
  const hasRole = requiredRoles.some(role => member.roles.cache.has(role));
  console.log("Role check for member:", member.user.tag, "Result:", hasRole);
  return hasRole;
}

async function sendModlogEmbed(context, user, logs, pageIndex) {
  try {
    console.log("sendModlogEmbed invoked for user:", user.tag);

    if (logs.length === 0) {
      return context.reply(`No logs found for ${user.tag}`);
    }

    const itemsPerPage = 5;
    const totalPages = Math.ceil(logs.length / itemsPerPage);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Moderation Logs for ${user.tag}`, iconURL: user.displayAvatarURL() })
      .setColor("#FF0000")
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages}` });

    const start = pageIndex * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = logs.slice(start, end);

    console.log("Page items for embed:", pageItems);

    pageItems.forEach(log => {
      embed.addFields(
        { name: "Action", value: log.type, inline: true },
        { name: "Reason", value: log.reason, inline: true },
        { name: "Date", value: new Date(log.date).toLocaleString(), inline: true },
        { name: "Issuer", value: log.issuer, inline: true }
      );
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === totalPages - 1)
      );

    const messageOptions = { embeds: [embed], components: [row] };

    const replyMessage = context.deferred
      ? await context.editReply(messageOptions)
      : await context.reply(messageOptions);

    const filter = i => i.user.id === context.user.id && (i.customId === 'prev' || i.customId === 'next');
    const collector = replyMessage.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on('collect', async i => {
      if (i.customId === 'prev' && pageIndex > 0) {
        pageIndex--;
      } else if (i.customId === 'next' && pageIndex < totalPages - 1) {
        pageIndex++;
      }

      await sendModlogEmbed(i, user, logs, pageIndex);
      await i.deferUpdate();
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

      replyMessage.edit({ components: [disabledRow] });
    });
  } catch (error) {
    console.error("Error in sendModlogEmbed:", error);
    context.reply("An error occurred while generating the modlog embed.");
  }
}
