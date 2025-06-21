const { SlashCommandBuilder, MessageFlags } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('get information about user, blank for yourself')
        .addUserOption(option => 
            option.setName("target").setDescription("The user to lookup, leave blank to lookup your own profile").setRequired(false)
        ),
    async execute(interaction) {

    }
}