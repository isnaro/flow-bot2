const { ApplicationCommandOptionType, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require('fs');
const path = require('path');

const logsFilePath = path.join(__dirname, '../modlogs.json');

function getLogs() {
  if (!fs.existsSync(logsFilePath)) {
    fs.writeFileSync(logsFilePath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(logsFilePath));
}

module.exports = {
  name: "modlogs",
  description: "Displays moderation logs for a user",
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
    }

    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const logs = getLogs()[target.user.id] || [];
    await sendModlogEmbed(message, target.user, logs, 0);
  },
};

function hasRequiredRole(member) {
  const requiredRoles = ["1226166868952350721", "1226167494226608198"];
  return member.roles.cache.some(role => requiredRoles.includes(role.id));
}

async function sendModlogEmbed(context, user, logs, pageIndex) {
  if (logs.length === 0) {
    return context.reply({ content: `No logs found for ${user.tag}`, ephemeral: true });
  }

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
    }

    await i.deferUpdate();
    await sendModlogEmbed(i, user, reversedLogs, pageIndex);
  });

  collector.on('end', async () => {
    const disabledRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle('PRIMARY')
          .setDisabled(true),
        new MessageButton()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle('PRIMARY')
          .setDisabled(true)
      );

    if (context.replied || context.deferred) {
      await context.editReply({ components: [disabledRow] });
    } else {
      await context.editReply({ components: [disabledRow] });
    }
  });
}
