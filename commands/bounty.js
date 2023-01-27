const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActionRow, Component } = require('discord.js');
const { writeFile } = require('node:fs');

function generateComponentArray(component_arr, mob_arr, bounties_followed) {
    const num_mobs = mob_arr.length;
    for (let i = 0; i < num_mobs / 4; i++)
        component_arr.push(new ActionRowBuilder());

    let index = 0;
    while (index < num_mobs) {
        const mob_name = mob_arr[index];
        let style;
        if (bounties_followed.includes(mob_name)) {
            style = ButtonStyle.Success;
        } else {
            style = ButtonStyle.Secondary;
        }
        component_arr[Math.floor(index / 4)].addComponents(
            new ButtonBuilder()
                .setCustomId(mob_name)
                .setLabel(mob_name)
                .setStyle(style)
        );
        index++;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bounty')
        .setDescription('Manage bounty notifications')
        .addSubcommand(subcommand => subcommand
            .setName('dungeons')
            .setDescription('Choose dungeon bounties to follow')
        )
        .addSubcommand(subcommand => subcommand
            .setName('summons')
            .setDescription('Choose summon bounties to follow')
            .addStringOption(option => option
                .setName('level')
                .setDescription('Choose level range for summon bounties')
                .setRequired(true)
                .addChoices(
                    { name: 'High (70+)', value: 'high' },
                    { name: 'Low (1-65)', value: 'low'}
                )
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('ff')
            .setDescription('Choose FF bounties to follow')
            .addStringOption(option => option
                .setName('area')
                .setDescription('Choose FF area')
                .setRequired(true)
                .addChoices(
                    { name: 'FF1', value: '1' },
                    { name: 'FF2', value: '2' },
                    { name: 'FF3', value: '3' },
                    { name: 'FF4', value: '4' },
                    { name: 'FF5', value: '5' },
                    { name: 'FF6', value: '6' },
                    { name: 'FF7', value: '7' },
                    { name: 'FF8', value: '8' },
                    { name: 'FF9', value: '9' },
                    { name: 'FF10', value: '10' },
                    { name: 'FF11', value: '11' },
                    { name: 'FF12', value: '12' }
                )
            )
        ),
    async execute(interaction) {
        let bounty_object = interaction.client.bounty_preferences;
        let bounties_followed;
        if (bounty_object.hasOwnProperty(interaction.user.id)) {
            bounties_followed = bounty_object[interaction.user.id].bounties;
        } else {
            bounty_object[interaction.user.id] = {
                "username": interaction.user.username,
                "bounties": []
            };
            bounties_followed = bounty_object[interaction.user.id].bounties;
        }
        const component_arr = new Array();
        const mobs = interaction.client.mobs;
        let mob_arr;

        if (interaction.options.getSubcommand() === 'dungeons') {
            mob_arr = mobs.dungeons;
            generateComponentArray(component_arr, mob_arr, bounties_followed);
            await interaction.reply({ content: 'Select dungeon bounties to follow', components: component_arr });
        } else if (interaction.options.getSubcommand() === 'summons') {
            if (interaction.options.getString('level') === 'high') {
                mob_arr = mobs.summons.high;
            } else {
                mob_arr = mobs.summons.low;
            }
            generateComponentArray(component_arr, mob_arr, bounties_followed);
            await interaction.reply({ content: 'Select summon bounties to follow', components: component_arr });
        } else if (interaction.options.getSubcommand() === 'ff') {
            mob_arr = mobs.ff[interaction.options.getString('area')];
            generateComponentArray(component_arr, mob_arr, bounties_followed);
            await interaction.reply({ content: 'Select FF bounties to follow', components: component_arr });
        }

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({filter, time: 60000 });
        collector.on('collect', async i => {
            let mob = i.component.customId;
            let index = mob_arr.indexOf(mob);
            if (index < 0) {
                console.error('Button clicked was not found in mob_arr');
                return;
            }
            let row = Math.floor(index / 4);
            let col = index % 4;

            let buttonClicked = component_arr[row].components[col];

            if (i.component.style == ButtonStyle.Success) {
                console.log(`Removing ${mob} from ${i.user.username}'s bounty list.`);
                let bounties = i.client.bounty_preferences[i.user.id].bounties;
                const index = bounties.indexOf(mob);
                bounties.splice(index, 1);
                buttonClicked.setStyle(ButtonStyle.Secondary);
            } else {
                console.log(`Adding ${mob} to ${i.user.username}'s bounty list.`);
                i.client.bounty_preferences[i.user.id].bounties.push(mob);
                buttonClicked.setStyle(ButtonStyle.Success);
            }

            writeFile('./jsons/bounty_preferences.json', JSON.stringify(i.client.bounty_preferences, null, 2), (err) => {
                if (err) {
                    console.log('An error has occured updating the bounty_preferences.json file', err)
                } else {
                    console.log('bounty_preferences.json successfully updated');
                }
            });

            await i.update({
                components: component_arr
            });
        });
        collector.on('end', collector => {});
    },
};