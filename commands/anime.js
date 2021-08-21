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
        seasonYear
        coverImage {
            large
            color
        }
        averageScore
        genres
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

        let index = 0;

        const response = await fetch(url, options)
            .then(response => response.json());

        const anime = response.data.Media;
        const embed = createEmbed(anime);

        await interaction.editReply({ ephemeral: false, embeds: [embed] });
    }
}

function createEmbed(anime) {
    const genres = anime.genres.length > 5 ? anime.genres.splice(5) : anime.genres
    return new MessageEmbed()
        .setColor(anime.coverImage.color)
        .setTitle(anime.title.english)
        .setURL('https://anilist.co/anime/' + anime.id)
        .setThumbnail(anime.coverImage.large)
        .setDescription(anime.description.replaceAll(/(<\S*>)/g, ''))
        .addFields(
            { name: 'Score', value: '' + (anime.averageScore / 10) + ' ⭐', inline: true },
            { name: 'Year', value: '' + anime.seasonYear, inline: true },
            { name: 'Genres', value: '' + genres.join(', '), inline: true}
        )
}