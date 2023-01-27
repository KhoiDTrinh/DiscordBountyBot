const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { writeFile } = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startathenapings')
        .setDescription('yes, for forever'),
    async execute(interaction) {
        let client = interaction.client;

        if (!client.hasOwnProperty('athenapings'))
            client['athenapings'] = true;
        else {
            client['athenapings'] = !client['athenapings'];
        }
        const channel = interaction.client.channels.cache.get(interaction.channelId);

        if (client['athenapings'])
            await interaction.reply('Gotcha, boss.');
        else
            await interaction.reply("Fine... I'll give Athena a break");

        while (client['athenapings']) {
            channel.send('<@628386552006836226> WAKE UP ATHENA');
            await wait(15000);
        }
    },
};