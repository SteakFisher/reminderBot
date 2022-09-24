const {revokeToken} = require("./revoke");
const {delFirebaseDocs} = require("./customFunctions");
module.exports = {
    revokeAccessCmd: async function(db, interaction, oAuth2Client){
        let doc = await db.doc(`users/${interaction.user.id}`).get();
        let result = doc.data();

        if(!result){
            console.log("Account not linked");
            interaction.reply({
                content: "You do not have a Google account linked to this bot! Visit https://myaccount.google.com/permissions?continue=https%3A%2F%2Fmyaccount.google.com%2Fsecurity%3Fpli%3D1 to manually delink!",
                ephemeral: true
            });
        }
        else{
            await interaction.deferReply({ ephemeral: true });
            console.log("Account linked revoking access..");
            oAuth2Client.setCredentials({
                refresh_token: result.refresh_token,
                scope: "https://www.googleapis.com/auth/calendar.events",
                token_type: "Bearer",
                expiry_date: result.expiry_date
            });
            await oAuth2Client.getAccessToken()
            oAuth2Client.revokeCredentials()
            await delFirebaseDocs(`users/${interaction.user.id}`, db);
            await interaction.editReply({
                content: "Google Authorization revoked!",
                ephemeral: true
            });
            console.log("Account access revoked!");
        }
    }
}