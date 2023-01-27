const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { writeFile } = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawnace')
        .setDescription('Spawns frenzy'),
    async execute(interaction) {
        await interaction.reply("<@468512328757805059> Hey mister hellspawn, 1 hr clan frenzy plz");
    },
};