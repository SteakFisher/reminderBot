const Discord = require("discord.js");
module.exports = {
    sendAddEventEmbed: function(title, startTimeTemp, endTimeTemp){
        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('set-event')
                    .setLabel('Add to Google Calender')
                    .setStyle(Discord.ButtonStyle.Success)
            )

        const embed = new Discord.EmbedBuilder()
            .setTitle(title)
            .setColor("#00ffef")
            .setTimestamp()
            .setDescription(`**Start time:**\n ${startTimeTemp[0]} ${startTimeTemp[1]}\n\n**End time:**\n ${endTimeTemp[0]} ${endTimeTemp[1]}`)

        return [embed, row]
    },

    sendVerifyEmbed: function(authorizeUrl, interaction, sent){
        const embed = new Discord.EmbedBuilder()
            .setTitle("Verification")
            .setColor("#00ffef")
            .setDescription(`[**Verify your Google Account**](${authorizeUrl})`)
            .setTimestamp()

        interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    },

    sendErrorEmbed: function(interaction){
        const embed = new Discord.EmbedBuilder()
            .setTitle("Error")
            .setColor("#ff0000")
            .setDescription("Something went wrong. Please delink your Google Account using the /revoke-account-access command and try again.")
            .setTimestamp()

        interaction.user.send({
            embeds: [embed]
        })
    },

    sendSuccessEmbed: function(interaction){
        const embed = new Discord.EmbedBuilder()
            .setTitle("Success")
            .setColor("#00ffef")
            .setDescription("Successfully added to Google Calender!")
            .setTimestamp()

        interaction.user.send({
            embeds: [embed]
        })
    }
}