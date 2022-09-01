const customFuncs = require("./customFunctions");
const sendEmbed = require("./sendEmbed");
const {revokeToken} = require("./revoke");
const {delFirebaseDocs} = require("./customFunctions");
const constants = require("../Creds/constants.json");
const {app} = require("firebase-admin");

module.exports = {
    AuthCredsFromUser: async function (interaction, db, oAuth2Client, sent, app) {

        let retVal = await customFuncs.getAuthTokens(oAuth2Client, app);
        console.log("Got Auth Tokens")
        let r = retVal[0];
        let state = retVal[1];

        if(r === 'Timed Out'){
            return console.log("Took more then 30 seconds to verify, regenerate link and try again!");
        }

        if(!r.scope){
            return interaction.user.send(`Permissions missing! please check all scopes during authorization.`)
        }

        if(r.access_token && r.refresh_token && r.expiry_date && state){
            await db.doc(`users/${state}`).set({
                access_token: r.access_token,
                refresh_token: r.refresh_token,
                expiry_date: r.expiry_date
            }).then(() => {
                oAuth2Client.setCredentials(r);
                interaction.user.send("Google Authorization successful!")
            })
        }
        else{
            console.log('gotcha')
            sendEmbed.sendErrorEmbed(interaction)
        }
    },

    AuthCredsFromDB: async function (interaction, db, oAuth2Client, result) {
        try{
            oAuth2Client.setCredentials({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                scope: "https://www.googleapis.com/auth/calendar.events",
                token_type: "Bearer",
                expiry_date: result.expiry_date
            });
        }catch(err){
            console.log(err);
            revokeToken(result.access_token);
            await delFirebaseDocs(`users/${interaction.user.id}`, db);
            await this.AuthCredsFromUser(interaction, db, oAuth2Client);
        }

    }
}