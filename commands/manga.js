const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manga')
        .setDescription('Search for a manga on AniList.')
        .addStringOption(option =>
            option.setName('search')
            .setDescription('The title to search for')
            .setRequired(true)
            ),
    async execute(interaction) {
        return interaction.reply(`This will return your search... eventually`);
    }
}
