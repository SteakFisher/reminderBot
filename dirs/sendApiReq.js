const sendEmbed = require("./sendEmbed");
const {google} = require("googleapis");
const moment = require("moment");
const {sendSuccessEmbed} = require("./sendEmbed");
const calendar = google.calendar('v3');

module.exports = {
    calApiReq: async function(interaction, sent, db){
        console.log("calendar Api Req")
        let doc = await db.doc(`reminders/${interaction.message.id}`).get();
        let result = doc.data();
        let title = result["title"];
        let startTimeTemp = moment.unix(result["startDate"]["seconds"]).format("YYYY-MM-DD HH:mm:ss").split(" ")
        let endTimeTemp = moment.unix(result["endDate"]["seconds"]).format("YYYY-MM-DD HH:mm:ss").split(" ")

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
                sendSuccessEmbed(interaction);
            })
        }
        catch(err){
            console.log("Error sending request to Google Calendar API: ");
            sendEmbed.sendErrorEmbed(interaction);
        }
    }
}