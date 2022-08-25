const customFuncs = require("./customFunctions");
const sendEmbed = require("./sendEmbed");
const {revokeToken} = require("./revoke");

module.exports = {
    AuthCredsFromUser: async function (interaction, con, oAuth2Client, authorizeUrl) {
        sendEmbed.sendVerifyEmbed(authorizeUrl, interaction);
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
        if(r[0].tokens.access_token && r[0].tokens.refresh_token && r[0].tokens.expiry_date){
            con.query(`INSERT INTO users (userId, access_token, refresh_token, expiry_date) VALUES ('${interaction.user.id}', '${r[0].tokens.access_token}', '${r[0].tokens.refresh_token}', ${r[0].tokens.expiry_date})`, (err) => {
                if (err) console.log(err)
                oAuth2Client.setCredentials(r[0].tokens);
                interaction.user.send("Google Authorization successful!")
            })
        }
        else{
            sendEmbed.sendErrorEmbed(interaction)
        }
    },

    AuthCredsFromDB: async function (interaction, con, oAuth2Client, result, authorizeUrl) {
        try{
            oAuth2Client.setCredentials({
                access_token: result[0].access_token,
                refresh_token: result[0].refresh_token,
                scope: "https://www.googleapis.com/auth/calendar.events",
                token_type: "Bearer",
                expiry_date: result[0].expiry_date
            });
        }catch(err){
            console.log(err);
            revokeToken(result[0].access_token);
            con.query(`DELETE FROM users WHERE userId = '${interaction.user.id}'`, (err) => {
                if (err) console.log(err)
                this.AuthCredsFromUser(interaction, con, oAuth2Client, authorizeUrl);
            })
        }

    }
}