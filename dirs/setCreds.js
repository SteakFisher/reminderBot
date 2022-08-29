const customFuncs = require("./customFunctions");
const sendEmbed = require("./sendEmbed");
const {revokeToken} = require("./revoke");
const {delFirebaseDocs} = require("./customFunctions");

module.exports = {
    AuthCredsFromUser: async function (interaction, db, oAuth2Client, authorizeUrl, sent) {
        sendEmbed.sendVerifyEmbed(authorizeUrl, interaction, sent);
        const promise1 = new Promise((resolve) => {
            setTimeout(resolve, 30000, "Timed Out");
        });

        const promise2 = new Promise(async (resolve) => {
            resolve(await customFuncs.getAuthTokens(oAuth2Client))
        })

        let r = await Promise.race([promise1, promise2]).then(async (value) => {
            return value
        });

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

    AuthCredsFromDB: async function (interaction, db, oAuth2Client, result, authorizeUrl) {
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
            await this.AuthCredsFromUser(interaction, db, oAuth2Client, authorizeUrl);
        }

    }
}