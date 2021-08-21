const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { default: fetch } = require('node-fetch');
const anime = require('./anime');

const query = `
    query ($search: String) {
        Media(type: MANGA, search: $search, sort: POPULARITY_DESC) {
        id
        title {
            romaji
            english
            native
        }
        description(asHtml: false)
        startDate {
            year
        }
        coverImage {
            large
            color
        }
        averageScore
        genres
        status(version: 2)
        }
    }
`

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
        const search = interaction.options.getString('search');
        const url = 'https://graphql.anilist.co'
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                variables: { 'search': search }
            })
        }

        const response = await fetch(url, options)
            .then(response => response.json());

        const manga = response.data.Media;
        const embed = createEmbed(manga);

        return interaction.editReply({ ephemeral: false, embeds: [embed] });
    }
}

function createEmbed(manga) {
    const genres = manga.genres.length > 5 ? manga.genres.splice(5) : manga.genres
    const status = (manga.status.charAt(0) + manga.status.substring(1).toLowerCase()).replaceAll('_', ' ');
    let title;
    if (manga.title.english === null) {
        if (manga.title.romaji === null) {
            title = manga.title.native;
        } else {
            title = manga.title.romaji;
        }
    } else {
        title = manga.title.english;
    }

    return new MessageEmbed()
        .setColor(manga.coverImage.color)
        .setTitle(title)
        .setURL('https://anilist.co/manga/' + manga.id)
        .setThumbnail(manga.coverImage.large)
        .setDescription(manga.description.replaceAll(/(<\S*>)/g, ''))
        .addFields(
            { name: 'Score', value: '' + (manga.averageScore / 10) + ' ⭐', inline: true },
            { name: 'Status', value: status, inline: true},
            { name: 'Year', value: '' + manga.startDate.year, inline: true },
            { name: 'Genres', value: '' + genres.join(', '), inline: true}
        )
}