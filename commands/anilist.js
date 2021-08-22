const { SlashCommandBuilder } = require("@discordjs/builders");
const { promisifyAll } = require("bluebird");
const Redis = require('redis');
const config = require('../config.json');

const query = `

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
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const redis = Redis.createClient(config.redisUrl);
        promisifyAll(redis);

        const clientId = interaction.user.id;

        if (interaction.options.getSubcommand() === 'set') {
            const reply = await redis.setAsync(clientId, interaction.options.getString('name'))
            if (reply === 'OK') 
                await interaction.editReply({ content: `You've successfully changed your AniList profile to ${interaction.options.getString('name')}`, ephemeral: true });
            else
                await interaction.editReply({ content: 'Something went wrong while trying to change your profile', ephemeral: true });
        }

        if (interaction.options.getSubcommand() === 'get') {
            const value = await redis.getAsync(clientId);
            console.log(value);
        }

        redis.quit();

        await interaction.editReply('Check console');
    }
}