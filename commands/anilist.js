const { SlashCommandBuilder, italic } = require("@discordjs/builders");
const { promisifyAll } = require("bluebird");
const { MessageEmbed } = require("discord.js");
const { default: fetch } = require("node-fetch");
const Redis = require('redis');
const config = require('../config.json');

const query = `
query ($name: String) {
  User(search: $name sort: SEARCH_MATCH) {
    name
    avatar {
      medium
    }
    bannerImage
    siteUrl
    about(asHtml: false) 
  }
}
`

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anilist')
        .setDescription('Get info about your AniList profile')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your AniList profile')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Your AniList profile name')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get your AniList profile')
                .addStringOption(option =>
                    option.setName('search')
                        .setDescription('Search for a different user\'s profile')
                        .setRequired(false)
                )
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const redis = Redis.createClient(config.redisUrl);
        promisifyAll(redis);

        const clientId = interaction.user.id;

        let reply;

        if (interaction.options.getSubcommand() === 'set') {
            const response = await redis.setAsync(clientId, interaction.options.getString('name'))
            if (response === 'OK')
                reply = { content: `You've successfully changed your AniList profile to ${interaction.options.getString('name')}`, ephemeral: true };
            else
                reply = { content: 'Something went wrong while trying to change your profile', ephemeral: true };
        }

        if (interaction.options.getSubcommand() === 'get') {
            const name = interaction.options.getString('search') ? interaction.options.getString('search') : await redis.getAsync(clientId);

            const url = 'https://graphql.anilist.co';
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    variables: { 'name': name }
                })
            }
            const response = await fetch(url, options)
                .then(response => response.json());

            const profile = response.data.User;
            if (profile.errors) {
                reply = { content: `The user ${name} could not be found.`, ephemeral: true }
            } else {
                const about = profile.about !== null ? profile.about : italic('This user has not written an about section.')

                const embed = new MessageEmbed()
                    .setThumbnail(profile.avatar.medium)
                    .setTitle(profile.name + '\'s AniList')
                    .setURL(profile.siteUrl)
                    .setImage(profile.bannerImage)
                    .setDescription(about)
                reply = { embeds: [embed] };
            }
        }

        redis.quit();

        await interaction.editReply(reply);
    }
}