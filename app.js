const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discord.js/rest');
const { Routes} = require('discord-api-types/v9');
const config = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;

});

client.login(config.token);