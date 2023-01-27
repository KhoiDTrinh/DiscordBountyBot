const { Events } = require('discord.js');


module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				await interaction.reply(`No command matching ${interaction.commandName} was found.`);
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
			try {
				console.log(`Received ${interaction.commandName} command from user ${interaction.user.username}`);
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};