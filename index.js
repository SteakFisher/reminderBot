const Discord = require('discord.js')
const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const keys = require('./keys.json');
const constants = require('./constants.json');
const http = require('http');
const url = require('url');
const destroyer = require('server-destroy');
const calendar = google.calendar('v3');
const mysql = require('mysql');
const customFuncs = require("./customFunctions");

require('dotenv').config();
let con = {}

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

    con.connect(function(err) {
        if (err) console.log(err);
        console.log("Connected!");
    });

    con.query("CREATE DATABASE IF NOT EXISTS reminderBot", (err, result) => {
      if(err) console.log(err)
      console.log("Database created");
    })
    con.query("USE reminderBot", (err, result) => {
        if(err) console.log(err)
        console.log("Database selected");
    })
    con.query("CREATE TABLE IF NOT EXISTS reminders (id INT AUTO_INCREMENT PRIMARY KEY, messageId VARCHAR(30) UNIQUE, guildId VARCHAR(30), title varchar(255), startDate DATETIME, endDate DATETIME)", (err, result) => {
        if(err) console.log(err)
        console.log("Table created");
    })

    let commands = client.application.commands;
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
                .setDescription(`**Start time:**\n ${startTimeTemp[0]} ${startTimeTemp[1]}\n**End time:**\n ${endTimeTemp[0]} ${endTimeTemp[1]}`)

            let messageId = "";
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
            const embed = new Discord.EmbedBuilder()
                .setTitle("Verification")
                .setColor("#00ffef")
                .setDescription(`[**Verify your Google Account**](${authorizeUrl})`)
                .setTimestamp()

            let title = ""
            let startTimeTemp = []
            let endTimeTemp = []

            con.query(`SELECT * FROM reminders WHERE messageId = '${interaction.message.id}'`, (err, result) => {
                if(err) console.log(err);
                console.log(result)
                title = result[0]["title"];
                startTimeTemp = result[0]["startDate"].split(" ");
                endTimeTemp = result[0]["endDate"].split(" ");

                startTimeTemp = `${startTimeTemp[0]}T${startTimeTemp[1]}`;
                endTimeTemp = `${endTimeTemp[0]}T${endTimeTemp[1]}`;
            })

            interaction.reply({
                embeds: [embed],
                ephemeral: true
            })

            const promise1 = new Promise((resolve, reject) => {
                setTimeout(resolve, 30000, "Timed Out");
            });

            const promise2 = new Promise(async (resolve, reject) => {
                resolve(await customFuncs.getAuthClient(oAuth2Client))
            })

            oAuth2Client = await Promise.race([promise1, promise2]).then(async (value) => {
                return value
            });


            if(oAuth2Client === 'Timed Out') return console.log(oAuth2Client)
            google.options({auth: oAuth2Client});

            const res = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                    summary: title,
                    start: {
                        dateTime: startTimeTemp,
                        timeZone: 'Etc/Greenwich'
                    },

                    end: {
                        dateTime: endTimeTemp,
                        timeZone: 'Etc/Greenwich'
                    }
                }
            })
        }
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)

//DONE