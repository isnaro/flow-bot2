// src/events/interactionCreate.js
module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
      if (interaction.isButton()) {
        // Handle button interaction
        const { customId } = interaction;
        const command = interaction.client.slashCommands.get(customId);
        if (!command) return;
  
        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(error);
          await interaction.reply({ content: 'There was an error while executing this button interaction!', ephemeral: true });
        }
      } else if (interaction.isCommand()) {
        // Handle slash command interaction
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
  