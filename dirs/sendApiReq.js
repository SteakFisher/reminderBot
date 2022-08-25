const sendEmbed = require("./sendEmbed");
const {google} = require("googleapis");
const {OAuth2Client} = require("google-auth-library");
const calendar = google.calendar('v3');
module.exports = {
    calApiReq: function(con, interaction, sent){
        con.query(`SELECT * FROM reminders WHERE messageId = '${interaction.message.id}'`, async (err, resultSql) => {
            if(err) console.log(err)
            let title = resultSql[0]["title"];
            let startTimeTemp = resultSql[0]["startDate"].split(" ");
            let endTimeTemp = resultSql[0]["endDate"].split(" ");

            let startTime = `${startTimeTemp[0]}T${startTimeTemp[1]}`;
            let endTime = `${endTimeTemp[0]}T${endTimeTemp[1]}`;

            try{
                const res = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: {
                        summary: title,
                        start: {
                            dateTime: startTime,
                            timeZone: 'Etc/Greenwich'
                        },

                        end: {
                            dateTime: endTime,
                            timeZone: 'Etc/Greenwich'
                        }
                    }
                }).then(() => {
                    if(!sent){
                        interaction.reply({
                            content: "Event set!",
                            ephemeral: true
                        });
                        sent = true;
                    }
                    else{
                        sendEmbed.sendSuccessEmbed(interaction)
                    }
                })
            }
            catch(err){
                console.log(err)
                sendEmbed.sendErrorEmbed(interaction);
            }
        })
    }
}