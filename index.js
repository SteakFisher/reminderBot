const Discord = require('discord.js')
const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const keys = require('./Creds/keys.json');
const cmdSetup = require("./dirs/cmdSetup");
const setCreds = require("./dirs/setCreds");
const {addEventCmd} = require("./dirs/addEventCmd");
const {calApiReq} = require("./dirs/sendApiReq");
const {revokeAccessCmd} = require("./dirs/revokeAccessCmd");
const admin = require("firebase-admin");
const serviceAccount = require("./Creds/firebaseCreds.json");
const {getFirestore} = require("firebase-admin/firestore");
const express = require("express");
const constants = require("./Creds/constants.json");
const sendEmbed = require("./dirs/sendEmbed");
const {addReactor} = require("./dirs/addReactor");
require('dotenv').config();
//DONE

async function main(){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://reminderbot-359419-default-rtdb.europe-west1.firebasedatabase.app"
    });
    let db = getFirestore();

    let app = express()

    app.set('port', (process.env.PORT || 443));
    app.listen(process.env.PORT || 443, function() {
        console.log('App is running, server is listening on port ', app.get('port'));
    });

    app.get('/', async function(request, response) {
        response.sendFile('googlecb4c7e4aca826dab.html', {root: __dirname});
    })

    app.get('/googlecb4c7e4aca826dab.html', async function(request, response) {
        response.sendFile('googlecb4c7e4aca826dab.html', {root: __dirname});
    })

    app.get('/api/auth/home', async function(request, response) {
        response.send("Hi I'm SteakFisher and I am a backend dev, so can't be bothered coding a website! Thanks for using reminderbot :D")
    })
    app.get('/api/auth/privacypolicy', async function(request, response) {
        response.send("All data collected is merely for Google Authentication, verification procedures, and processing efficiency. \n" +
            "None of the data is made available to any third party.\n" +
            "The reminder bot will merely add events to your Google Calendar based upon the embed content above the button, nothing more nothing less.")
    })



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

    client.on("ready", () => {
        let commands = client.application.commands;
        cmdSetup.cmdSetup(commands);
        console.log(`Logged in as ${client.user.tag}!`)
    })

    client.on("interactionCreate", async (interaction) => {
        if(interaction.type === Discord.InteractionType.ApplicationCommand){
            if(interaction.commandName === 'add-event') {
                console.log("interaction: add-event cmd")
                addEventCmd(interaction, db);
            }
            if(interaction.commandName === 'revoke-account-access'){
                revokeAccessCmd(db, interaction, oAuth2Client);
            }
            if(interaction.commandName === 'verify-google'){
                let authorizeUrl = oAuth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: constants.scopes,
                    state: interaction.user.id
                });
                sendEmbed.sendVerifyEmbed(authorizeUrl, interaction);
                console.log("interaction: verify-google cmd")
                return setCreds.AuthCredsFromUser(interaction, db, oAuth2Client, app, authorizeUrl)
            }
        }

        if(interaction.isButton()){
            if(interaction.customId === "set-event"){
                let sent = false;
                let doc = await db.doc(`users/${interaction.user.id}`).get();
                let result = doc.data();
                if (!result) {
                    interaction.reply({content: "You have not verified your google credentials yet. Please use the " +
                            "/verify-google command to set your credentials.", ephemeral: true})
                    console.log("User not linked! Sent verify msg ")
                }
                else{
                    await interaction.deferReply({ ephemeral: true });
                    await setCreds.AuthCredsFromDB(interaction, db, oAuth2Client, result);
                    console.log("Got creds from db, sending api request..")
                    setTimeout(async () => {
                        if(Object.keys(oAuth2Client.credentials).length > 0){
                            google.options({auth: oAuth2Client}); // works
                            calApiReq(interaction, sent, db) // works
                            addReactor(interaction, db);
                        }
                        else{
                            console.log(oAuth2Client.credentials)
                        }
                    }, 3000);
                }
            }
        }
    })
    client.login(process.env.DISCORD_BOT_TOKEN)
}

try {
    main();
}catch (e) {
    console.log(e)
}
