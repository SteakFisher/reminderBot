const customFuncs = require("./customFunctions");
const sendEmbed = require("./sendEmbed");
module.exports = {
    addEventCmd: function(con, interaction){
        let title = interaction.options.getString('title');
        let startTimeTemp = interaction.options.getString('start-time').split(" ");
        let endTimeTemp = interaction.options.getString('end-time').split(" ");
        let channel = interaction.options.getChannel('channel');
        let guild = interaction.guild;

        if(!startTimeTemp[1]) startTimeTemp[1] = '00:00:00';
        if(!endTimeTemp[1]) endTimeTemp[1] = '00:00:00';


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
            con.query(`INSERT INTO reminders (messageId, guildId, title, startDate, endDate) VALUES ('${embedMessage.id}', '${guild.id}', '${title}', '${startTimeTemp}', '${endTimeTemp}')`, (err, result) => {
                if(err) console.log(err)
            })
        })

        interaction.reply({
            content: "Embed sent successfully!",
            ephemeral: true
        })
    }
}