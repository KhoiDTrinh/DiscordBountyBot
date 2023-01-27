const { REST, Routes } = require('discord.js');
const dotenv = require("dotenv");


async function deployCommands() {
    dotenv.config();
    const token = process.env.CLIENT_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildIds = process.env.GUILD_ID.split(',');

    const fs = require('node:fs');



    const commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(token);

    (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            let data;
            for (const guildId of guildIds) {
                data = await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands },
                );
            }

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        }
        catch (error) {
            console.error(error);
        }
    })();
}

module.exports.deployCommands = deployCommands;