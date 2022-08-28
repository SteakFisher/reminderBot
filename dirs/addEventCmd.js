const customFuncs = require("./customFunctions");
const sendEmbed = require("./sendEmbed");
module.exports = {
    addEventCmd: function(interaction, db){
        let title = interaction.options.getString('title');
        let startTimeTemp = interaction.options.getString('start-time').split(" ");
        let endTimeTemp = interaction.options.getString('end-time').split(" ");
        let channel = interaction.options.getChannel('channel');
        let guild = interaction.guild;

        if(startTimeTemp.length !== 2) startTimeTemp.push('00:00:00')
        if(endTimeTemp.length !== 2) endTimeTemp.push('00:00:00')


        try{
            customFuncs.timeChecks(startTimeTemp[0] + " " + startTimeTemp[1])
        }
        catch(err){
            interaction.reply("Invalid start time");
            return
        }

        try{
            customFuncs.timeChecks(endTimeTemp[0] + " " + endTimeTemp[1])
        }
        catch(err){
            interaction.reply("Invalid end time");
            return
        }

        let embedBuild = sendEmbed.sendAddEventEmbed(title, startTimeTemp, endTimeTemp);

        channel.send({
            embeds: [embedBuild[0]],
            components: [embedBuild[1]]
        }).then(embedMessage => {
            const dataSet = db.doc(`reminders/${embedMessage.id}`).set({
                guildId: guild.id,
                title: title,
                startDate: new Date(startTimeTemp),
                endDate: new Date(endTimeTemp)
            })
        })

        interaction.reply({
            content: "Embed sent successfully!",
            ephemeral: true
        })
    }
}