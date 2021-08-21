const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { default: fetch } = require('node-fetch');

const query = `
    query ($search: String) {
        Media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
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
        .setName('anime')
        .setDescription('Search for an anime on AniList.')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('The title to search for')
                .setRequired(true)
        ),
    async execute(interaction) {
        const search = interaction.options.getString('search');
        const url = 'https://graphql.anilist.co';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                variables: { 'search': search },
            })
        }

        const response = await fetch(url, options)
            .then(response => response.json());

        const anime = response.data.Media;
        const embed = createEmbed(anime);

        await interaction.editReply({ ephemeral: false, embeds: [embed] });
    }
}

function createEmbed(anime) {
    const genres = anime.genres.length > 5 ? anime.genres.splice(5) : anime.genres;
    const status = (anime.status.charAt(0) + anime.status.substring(1).toLowerCase()).replaceAll('_', ' ');
    let title;
    if (anime.title.english === null) {
        if (anime.title.romaji === null) {
            title = anime.title.native;
        } else {
            title = anime.title.romaji;
        }
    } else {
        title = anime.title.english;
    }

    return new MessageEmbed()
        .setColor(anime.coverImage.color)
        .setTitle(title)
        .setURL('https://anilist.co/anime/' + anime.id)
        .setThumbnail(anime.coverImage.large)
        .setDescription(anime.description.replaceAll(/(<\S*>)/g, ''))
        .addFields(
            { name: 'Score', value: anime.averageScore !== null ? (anime.averageScore / 10) + ' ⭐' : 'N/A', inline: true },
            { name: 'Status', value: status, inline: true},
            { name: 'Year', value: anime.startDate.year !== null ? anime.startDate.year : 'TBA', inline: true },
            { name: 'Genres', value: '' + genres.join(', '), inline: true}
        )
}