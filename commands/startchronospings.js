const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { writeFile } = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startchronospings')
        .setDescription('yes, for forever'),
    async execute(interaction) {
        let client = interaction.client;

        if (!client.hasOwnProperty('hiropings'))
            client['hiropings'] = true;
        else if (client['hiropings'] && interaction.user.id == "468512328757805059") {
            await interaction.reply('You think you can get out of it that easily?!? Keep on suffering');
            return;
        }
        else {
            client['hiropings'] = !client['hiropings'];
        }
        const channel = interaction.client.channels.cache.get(interaction.channelId);

        if (client['hiropings'])
            await interaction.reply("I'm sure you meant /starthiropings");
        else
            await interaction.reply("Fine... I'll give Hiro a break");

        while (client['hiropings']) {
            channel.send('<@468512328757805059> WAKE UP HIRO');
            await wait(15000);
        }
    },
};