const Discord = require('discord.js')
const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const keys = require('./keys.json');
const constants = require('./constants.json');
const mysql = require('mysql');
const customFuncs = require("./dirs/customFunctions");
const cmdSetup = require("./dirs/cmdSetup");
const setCreds = require("./dirs/setCreds");
const {addEventCmd} = require("./dirs/addEventCmd");
const {calApiReq} = require("./dirs/sendApiReq");
const {revokeToken} = require("./dirs/revoke");
const {revokeAccessCmd} = require("./dirs/revokeAccessCmd");
require('dotenv').config();
//DONE

let sent = false;

con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "00b",
    dateStrings: true
});

customFuncs.sqlSetup(con);

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
    ],
    partials: ['GUILD_MEMBER']
})

let oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    keys.web.redirect_uris[0]
);

let authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: constants.scopes
});

client.on("ready", () => {
    let commands = client.application.commands;
    cmdSetup.cmdSetup(commands);
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on("interactionCreate", async (interaction) => {
    if(interaction.type === Discord.InteractionType.ApplicationCommand){
        if(interaction.commandName === 'add-event') {
            addEventCmd(con, interaction);
        }
        if(interaction.commandName === 'revoke-account-access'){
            revokeAccessCmd(con, interaction);
        }
    }

    if(interaction.isButton()){
        sent = false;
        if(interaction.customId === "set-event"){
            con.query(`SELECT * FROM users WHERE userId = '${interaction.user.id}'`, async (err, result) => {
                if(err) console.log(err);
                if (result.length === 0) {
                    await setCreds.AuthCredsFromUser(interaction, con, oAuth2Client, authorizeUrl);
                }
                else{

                    await setCreds.AuthCredsFromDB(interaction, con, oAuth2Client, result, authorizeUrl);
                }
                if(Object.keys(oAuth2Client.credentials).length > 0){
                    console.log(Object.keys(oAuth2Client.credentials).length > 0)
                    google.options({auth: oAuth2Client}); // works
                    calApiReq(con, interaction, sent) // works

                }
            })
        }
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)