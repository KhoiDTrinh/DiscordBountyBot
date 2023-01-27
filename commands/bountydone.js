const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { writeFile } = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bountydone')
        .setDescription('Stops bounty notifications for the rest of the day, or reactivates them if already paused'),
    async execute(interaction) {
        let timestamp = new Date();
        let year = timestamp.getUTCFullYear();
        let month = timestamp.getUTCMonth();
        let date = timestamp.getUTCDate();
        let bountydone = interaction.client.bountydone;
        let added = true;
        if (bountydone.year == year && bountydone.month == month && bountydone.date == date) {
            if (bountydone.arr.includes(interaction.user.id)) {
                added = false;
                const index = bountydone.arr.indexOf(interaction.user.id);
                bountydone.arr.splice(index, 1);
                console.log(`Same date, user already in list, removing ${interaction.user.username} from bountydone`);
            } else {
                bountydone.arr.push(interaction.user.id);
                console.log(`Same date, adding ${interaction.user.username} to bountydone`);
            }
            
        } else {
            console.log(`New date, clearing bountydone, adding user ${interaction.user.username}, and starting new day`);
            bountydone.year = year;
            bountydone.month = month;
            bountydone.date = date;
            bountydone.arr = [interaction.user.id];
        }
        writeFile('./jsons/bountydone.json', JSON.stringify(bountydone, null, 2), (err) => {
            if (err) {
                console.log('An error has occured updating the bountydone.json file', err)
            } else {
                console.log('bountydone.json successfully updated');
            }
        });

        if (added) {
            await interaction.reply('Your bounty notifications will be paused for the rest of the game day');
        } else {
            await interaction.reply('Your bounty notifications are now unpaused for the day');
        }
    },
};