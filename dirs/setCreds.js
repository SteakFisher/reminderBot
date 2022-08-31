const customFuncs = require("./customFunctions");
const sendEmbed = require("./sendEmbed");
const {revokeToken} = require("./revoke");
const {delFirebaseDocs} = require("./customFunctions");
const constants = require("../Creds/constants.json");

module.exports = {
    AuthCredsFromUser: async function (interaction, db, oAuth2Client, sent) {
        let authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: constants.scopes,
            state: interaction.user.id
        });

        sendEmbed.sendVerifyEmbed(authorizeUrl, interaction, sent);

        let r = await customFuncs.getAuthTokens(oAuth2Client);

        if(r === 'Timed Out'){
            return console.log("Took more then 30 seconds to verify, regenerate link and try again!");
        }

        if(!r[0].tokens.scope){
            return interaction.user.send(`Permissions missing! please check all scopes during authorization.`)
        }

        console.log(r[0].tokens)
        if(r[0].tokens.access_token && r[0].tokens.refresh_token && r[0].tokens.expiry_date){
            const dataSet = await db.doc(`users/${interaction.user.id}`).set({
                access_token: r[0].tokens.access_token,
                refresh_token: r[0].tokens.refresh_token,
                expiry_date: r[0].tokens.expiry_date
            }).then(() => {
                oAuth2Client.setCredentials(r[0].tokens);
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