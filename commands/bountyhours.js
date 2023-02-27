const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActionRow, Component } = require('discord.js');
const { writeFile } = require('node:fs');
const bounty = require('./bounty');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bountyhours')
        .setDescription('Set active hours to receive bounty pings')
        .addStringOption(option => option
            .setName('start_time')
            .setDescription('Time (UTC or game time) in hh:mm format to start receiving pings')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('end_time')
            .setDescription('Time (UTC or game time) in hh:mm format to stop receiving pings')
            .setRequired(true)
        ),
    async execute(interaction) {
        let bounty_preferences = interaction.client.bounty_preferences;
        let user_preferences = bounty_preferences[interaction.user.id];

        const starttime = interaction.options.getString('start_time');
        const endtime = interaction.options.getString('end_time');

        if (starttime.length > 5 || endtime.length > 5) {
            await interaction.reply({ content: 'Time was invalid', ephemeral: true });
            return;
        }

        try {
            startarr = starttime.split(":");
            endarr = endtime.split(":");

            if (startarr.length != 2 || endarr.length != 2) {
                await interaction.reply({ content: 'Time was invalid', ephemeral: true });
                return;
            }

            starthour = parseInt(startarr[0]);
            startminutes = parseInt(startarr[1]);
            endhour = parseInt(endarr[0]);
            endminutes = parseInt(endarr[1]);

            if (starthour < 0 || starthour > 23 ||
                endhour < 0 || endhour > 23 ||
                startminutes < 0 || startminutes > 59 ||
                endminutes < 0 || endminutes > 59
            ) {
                await interaction.reply({ content: 'Time was invalid', ephemeral: true });
                return;
            }

            user_preferences.bountyhours = {
                "starthour": starthour,
                "startminutes": startminutes,
                "endhour": endhour,
                "endminutes": endminutes
            }

            writeFile('./jsons/bounty_preferences.json', JSON.stringify(bounty_preferences, null, 2), (err) => {
                if (err) {
                    console.log('An error has occured updating the bounty_preferences.json file', err)
                } else {
                    console.log('bounty_preferences.json successfully updated');
                }
            });

            let str = 'Bounty active hours set to ' + starttime + " until " + endtime;

            await interaction.reply(str);
            return;
        }
        catch (err) {
            await interaction.reply({ content: 'Time was invalid', ephemeral: true });
            return;
        }
    },
};