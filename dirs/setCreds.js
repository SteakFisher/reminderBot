const customFuncs = require("./customFunctions");
const sendEmbed = require("./sendEmbed");
const {revokeToken} = require("./revoke");
const {delFirebaseDocs} = require("./customFunctions");

module.exports = {
    AuthCredsFromUser: async function (interaction, db, oAuth2Client, app, authorizeUrl) {
        return await customFuncs.getAuthTokens(oAuth2Client, app, authorizeUrl, async (retVal) => {
            console.log("Auth tokens received")
            let r = retVal[0];
            let state = retVal[1];

            if (r === 'Timed Out') {
                return console.log("Took more then 30 seconds to verify, regenerate link and try again!");
            }

            if (!r.scope) {
                console.log("Missing scopes")
                return interaction.user.send(`Permissions missing! please check all scopes during authorization.`)
            }

            if (r.access_token && r.refresh_token && r.expiry_date && state) {
                await db.doc(`users/${state}`).set({
                    access_token: r.access_token,
                    refresh_token: r.refresh_token,
                    expiry_date: r.expiry_date
                }).then(() => {
                    interaction.user.send("Google Authorization successful! All further reactions to events will be synced with your google calendar :D")
                })
                return true
            } else {
                console.log('Missing an element in the token object')
                sendEmbed.sendErrorEmbed(interaction)
            }
        })
    },

    AuthCredsFromDB: async function (interaction, db, oAuth2Client, result) {
        console.log("Authenticating from DB")
        try{
            oAuth2Client.setCredentials({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                scope: "https://www.googleapis.com/auth/calendar.events",
                token_type: "Bearer",
                expiry_date: result.expiry_date
            });
        }
        catch(err){
            console.log("Error setting credentials from DB, revoking token.. ")
            revokeToken(result.access_token);
            await delFirebaseDocs(`users/${interaction.user.id}`, db);
            await this.AuthCredsFromUser(interaction, db, oAuth2Client);
        }

    }
}