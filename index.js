const Discord = require('discord.js')
const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const keys = require('./keys.json');
const constants = require('./constants.json');
const calendar = google.calendar('v3');
const mysql = require('mysql');
const customFuncs = require("./customFunctions");
const cmdSetup = require("./cmdSetup");

require('dotenv').config();
let con = {}
let result = {};

let oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    keys.web.redirect_uris[0]
);

let authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: constants.scopes
});


const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
    ],
    partials: ['GUILD_MEMBER']
})

client.on("ready", () => {
    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "00b",
        dateStrings: true
    });

    customFuncs.sqlSetup(con);

    let commands = client.application.commands;
    cmdSetup.cmdSetup(commands);
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on("interactionCreate", async (interaction) => {
    if(interaction.type === Discord.InteractionType.ApplicationCommand){
        if(interaction.commandName === 'add-event') {
            let title = interaction.options.getString('title');
            let startTimeTemp = interaction.options.getString('start-time').split(" ");
            let endTimeTemp = interaction.options.getString('end-time').split(" ");
            let channel = interaction.options.getChannel('channel');
            let guild = interaction.guild;

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

            if(!startTimeTemp[1]) startTimeTemp[1] = '00:00:00';
            if(!endTimeTemp[1]) endTimeTemp[1] = '00:00:00';

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

            channel.send({
                embeds: [embed],
                components: [row]
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

    if(interaction.isButton()){
        if(interaction.customId === "set-event"){
            let sent = false;
            con.query(`SELECT * FROM users WHERE userId = '${interaction.user.id}'`, async (err, sqlResult) => {
                if(err) console.log(err)
                result = sqlResult

                if (result.length === 0) {
                    const embed = new Discord.EmbedBuilder()
                        .setTitle("Verification")
                        .setColor("#00ffef")
                        .setDescription(`[**Verify your Google Account**](${authorizeUrl})`)
                        .setTimestamp()

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    })
                    sent = true;

                    const promise1 = new Promise((resolve, reject) => {
                        setTimeout(resolve, 30000, "Timed Out");
                    });

                    const promise2 = new Promise(async (resolve, reject) => {
                        resolve(await customFuncs.getAuthTokens(oAuth2Client, interaction.message, con))
                    })

                    let r = await Promise.race([promise1, promise2]).then(async (value) => {
                        return value
                    });

                    if(r.tokens.scope !== "https://www.googleapis.com/auth/calendar.events"){
                        return interaction.reply({
                            content: "You did not grant relevant permissions, please check all boxes during verification and try again.",
                        })
                    }

                    con.query(`INSERT INTO users (userId, access_token, refresh_token, expiry_date) VALUES ('${interaction.user.id}', '${r.tokens.access_token}', '${r.tokens.refresh_token}', ${r.tokens.expiry_date})`, (err, result) => {
                        if (err) console.log(err)
                    })

                    oAuth2Client.setCredentials(r.tokens);
                }
                else{
                    oAuth2Client.setCredentials({
                        access_token: result[0].access_token,
                        refresh_token: result[0].refresh_token,
                        scope: "https://www.googleapis.com/auth/calendar.events",
                        token_type: "Bearer",
                        expiry_date: result[0].expiry_date
                    });
                }

                let title = ""

                let startTime = ""
                let endTime = ""
                let resultSql;

                con.query(`SELECT * FROM reminders WHERE messageId = '${interaction.message.id}'`, async (err, resultSql) => {
                    if(err) console.log(err)
                    let title = resultSql[0]["title"];
                    let startTimeTemp = resultSql[0]["startDate"].split(" ");
                    let endTimeTemp = resultSql[0]["endDate"].split(" ");

                    startTime = `${startTimeTemp[0]}T${startTimeTemp[1]}`;
                    endTime = `${endTimeTemp[0]}T${endTimeTemp[1]}`;


                    if(oAuth2Client === 'Timed Out') return console.log(oAuth2Client)
                    google.options({auth: oAuth2Client});

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
                    })
                    if(!sent){
                        interaction.reply({
                            content: `${resultSql[0]["title"]} Event added to Google Calender!`,
                            ephemeral: true
                        })
                    }else{
                        interaction.user.send(`${resultSql[0]["title"]} Event added to Google Calender!`)
                    }
                })
            })
        }
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)

//DONE