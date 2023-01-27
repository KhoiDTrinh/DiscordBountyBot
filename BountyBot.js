const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

async function BountyBot() {
    dotenv.config();
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    client.commands = new Collection();

    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    client.once(Events.ClientReady, c => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    client.on(Events.InteractionCreate, interaction => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    });

    client.login(process.env.CLIENT_TOKEN);
}

module.exports.BountyBot = BountyBot;


/*
<ref * 1 > Message {
    channelId: '778342000607887455',
    guildId: '778342000607887452',
    id: '1055931076289245184',
    createdTimestamp: 1671823986838,
    type: 0,
    system: false,
    content: 'ping',
    author: User {
        id: '573415328466599936',
        bot: false,
        system: false,
        flags: UserFlagsBitField { bitfield: 0 },
        username: 'dangderr',
        discriminator: '1466',
        avatar: null,
        banner: undefined,
        accentColor: undefined
    },
    pinned: false,
    tts: false,
    nonce: '1055931077329158144',
    embeds: [],
    components: [],
    attachments: Collection(0)[Map] { },
    stickers: Collection(0)[Map] { },
    position: null,
    editedTimestamp: null,
    reactions: ReactionManager { message: [Circular * 1] },
    mentions: MessageMentions {
        everyone: false,
        users: Collection(0)[Map] { },
        roles: Collection(0)[Map] { },
        _members: null,
        _channels: null,
        _parsedUsers: null,
        crosspostedChannels: Collection(0)[Map] { },
        repliedUser: null
    },
    webhookId: null,
    groupActivityApplication: null,
    applicationId: null,
    activity: null,
    flags: MessageFlagsBitField { bitfield: 0 },
    reference: null,
    interaction: null
}
<ref * 1 > Message {
    channelId: '778342000607887455',
    guildId: '778342000607887452',
    id: '1055931077136490649',
    createdTimestamp: 1671823987040,
    type: 19,
    system: false,
    content: 'pong',
    author: ClientUser {
        id: '1052414385898922024',
        bot: true,
        system: false,
        flags: UserFlagsBitField { bitfield: 0 },
        username: 'Bounty Bot',
        discriminator: '6150',
        avatar: null,
        banner: undefined,
        accentColor: undefined,
        verified: true,
        mfaEnabled: true
    },
    pinned: false,
    tts: false,
    nonce: null,
    embeds: [],
    components: [],
    attachments: Collection(0)[Map] { },
    stickers: Collection(0)[Map] { },
    position: null,
    editedTimestamp: null,
    reactions: ReactionManager { message: [Circular * 1] },
    mentions: MessageMentions {
        everyone: false,
        users: Collection(1)[Map] { '573415328466599936' => [User] },
        roles: Collection(0)[Map] { },
        _members: null,
        _channels: null,
        _parsedUsers: null,
        crosspostedChannels: Collection(0)[Map] { },
        repliedUser: User {
            id: '573415328466599936',
            bot: false,
            system: false,
            flags: [UserFlagsBitField],
            username: 'dangderr',
            discriminator: '1466',
            avatar: null,
            banner: undefined,
            accentColor: undefined
        }
    },
    webhookId: null,
    groupActivityApplication: null,
    applicationId: null,
    activity: null,
    flags: MessageFlagsBitField { bitfield: 0 },
    reference: {
        channelId: '778342000607887455',
        guildId: '778342000607887452',
        messageId: '1055931076289245184'
    },
    interaction: null
}
*/