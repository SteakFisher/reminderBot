const {revokeToken} = require("./revoke");
const {delFirebaseDocs} = require("./customFunctions");
module.exports = {
    revokeAccessCmd: async function(db, interaction){
        let doc = await db.doc(`users/${interaction.user.id}`).get();
        let result = doc.data();

        if(!result){
            interaction.reply({
                content: "You do not have a Google account linked to this bot!",
                ephemeral: true
            });
        }
        else{
            revokeToken(result.access_token);
            await delFirebaseDocs(`users/${interaction.user.id}`, db);
            interaction.reply({
                content: "Google Authorization revoked!",
                ephemeral: true
            })
        }
    }
}