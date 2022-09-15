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
        }

        if(interaction.isButton()){
            if(interaction.customId === "set-event"){
                let sent = false;
                let doc = await db.doc(`users/${interaction.user.id}`).get();
                let result = doc.data();
                if (!result) {
                    console.log("User not linked! Verification.. ")
                    let authorizeUrl = oAuth2Client.generateAuthUrl({
                        access_type: 'offline',
                        scope: constants.scopes,
                        state: interaction.user.id
                    });
                    sendEmbed.sendVerifyEmbed(authorizeUrl, interaction, sent);
                    await setCreds.AuthCredsFromUser(interaction, db, oAuth2Client, sent, app)
                }
                else{
                    await setCreds.AuthCredsFromDB(interaction, db, oAuth2Client, result);
                }
                console.log("Got creds from user, sending api request..")
                setTimeout(async () => {
                    if(Object.keys(oAuth2Client.credentials).length > 0){
                        google.options({auth: oAuth2Client}); // works
                        calApiReq(interaction, sent, db) // works
                        addReactor(interaction, db);
                    }
                    else{
                        console.log(oAuth2Client.credentials)
                    }
                }, 1000);
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