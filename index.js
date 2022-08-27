const Discord = require('discord.js')
const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const keys = require('./Creds/keys.json');
const constants = require('./Creds/constants.json');
const cmdSetup = require("./dirs/cmdSetup");
const setCreds = require("./dirs/setCreds");
const {addEventCmd} = require("./dirs/addEventCmd");
const {calApiReq} = require("./dirs/sendApiReq");
const {revokeAccessCmd} = require("./dirs/revokeAccessCmd");
const admin = require("firebase-admin");
const serviceAccount = require("./Creds/firebaseCreds.json");
const {getFirestore} = require("firebase-admin/firestore");
require('dotenv').config();
//DONE

async function main(){

    const firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://reminderbot-359419-default-rtdb.europe-west1.firebasedatabase.app"
    });

    let db = getFirestore();

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
                addEventCmd(interaction, db);
            }
            if(interaction.commandName === 'revoke-account-access'){
                await revokeAccessCmd(db, interaction);
            }
        }

        if(interaction.isButton()){
            if(interaction.customId === "set-event"){
                let sent = false;
                let doc = await db.doc(`users/${interaction.user.id}`).get();
                let result = doc.data();
                if (!result) {
                    await setCreds.AuthCredsFromUser(interaction, db, oAuth2Client, authorizeUrl, sent);
                }
                else{
                    await setCreds.AuthCredsFromDB(interaction, db, oAuth2Client, result, authorizeUrl);
                }
                if(Object.keys(oAuth2Client.credentials).length > 0){
                    google.options({auth: oAuth2Client}); // works
                    await calApiReq(interaction, sent, db) // works
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