const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { writeFile } = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ischronosdoneyet')
        .setDescription('Ugh, can I stop pasting bounties?'),
    async execute(interaction) {
        let timestamp = new Date();
        let year = timestamp.getUTCFullYear();
        let month = timestamp.getUTCMonth();
        let date = timestamp.getUTCDate();
        let bountydone = interaction.client.bountydone;
        let bounty_preferences = interaction.client.bounty_preferences;

        if (bountydone.year != year || bountydone.month != month || bountydone.date != date || bountydone.arr.length == 0) {
            bountydone.arr = [];
            await interaction.reply('No one is done with bounties yet.')
            return;
        }

        let ischronosdone = false;
        let chronosid = '573415328466599936';
        if (bountydone.arr.includes(chronosid))
            ischronosdone = true;

        let notdone = [];

        for (let id in bounty_preferences) {
            if (id == chronosid)
                continue;
            if (bountydone.arr.includes(id))
                continue;
            notdone.push(id);
        }

        let output = "";
        if (ischronosdone)
            output += 'OMG Chronos finished his bounties already?!? ';
        else
            output += "ofc Chronos isn't done lul. ";

        if (notdone.length > 0) {
            for (let i = 0; i < notdone.length; i++) {
                output += bounty_preferences[notdone[i]].username + ' ';
            }

            if (ischronosdone)
                output += 'are still slacking off though!';
            else
                output += "aren't done yet either...";
        }
        else {
            if (ischronosdone)
                output += 'And everyone else is done, too!';
            else
                output += 'While everyone else is already done... so you might as well stop pasting bounties...';
        }

        await interaction.reply(output);
    },
};