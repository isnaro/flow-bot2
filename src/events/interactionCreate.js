// src/events/interactionCreate.js
module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
      if (interaction.isButton()) {
        const commandName = interaction.customId.split('_')[0];
        const command = interaction.client.slashCommands.get(commandName);
        if (!command) return;
  
        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(error);
          await interaction.reply({ content: 'There was an error while executing this button interaction!', ephemeral: true });
        }
      } else if (interaction.isCommand()) {
        const command = interaction.client.slashCommands.get(interaction.commandName);
        if (!command) return;
  
        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(error);
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
      }
    },
  };
  