const Discord = require("discord.js");
module.exports = {
    cmdSetup: function(commands){
        commands.create({
            name: 'add-event',
            description: 'Send an "Add to Google Calender" button',
            options: [
                {
                    name: 'title',
                    description: 'The title of the event',
                    required: true,
                    type: Discord.ApplicationCommandOptionType.String
                },
                {
                    name: 'start-time',
                    description: 'The start time (in GMT) of the event in the format YYYY-MM-DD HH:MM:SS',
                    required: true,
                    type: Discord.ApplicationCommandOptionType.String
                },
                {
                    name: 'end-time',
                    description: 'The end time (in GMT) of the event in the format YYYY-MM-DD HH:MM:SS',
                    required: true,
                    type: Discord.ApplicationCommandOptionType.String
                },
                {
                    name: 'channel',
                    description: 'The channel to send the button to',
                    required: true,
                    type: Discord.ApplicationCommandOptionType.Channel
                }
            ]
        })
    }
}