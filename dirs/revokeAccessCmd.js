const {revokeToken} = require("./revoke");
const {delFirebaseDocs} = require("./customFunctions");
module.exports = {
    revokeAccessCmd: async function(db, interaction, oAuth2Client){
        let doc = await db.doc(`users/${interaction.user.id}`).get();
        let result = doc.data();

        if(!result){
            interaction.reply({
                content: "You do not have a Google account linked to this bot!",
                ephemeral: true
            });
        }
        else{
            oAuth2Client.setCredentials({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                scope: "https://www.googleapis.com/auth/calendar.events",
                token_type: "Bearer",
                expiry_date: result.expiry_date
            });
            let accessToken = await oAuth2Client.getAccessToken()
            revokeToken(accessToken.token);
            await delFirebaseDocs(`users/${interaction.user.id}`, db);
            interaction.reply({
                content: "Google Authorization revoked!",
                ephemeral: true
            })
        }
    }
}