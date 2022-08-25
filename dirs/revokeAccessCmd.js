const {revokeToken} = require("./revoke");
module.exports = {
    revokeAccessCmd: function(con, interaction){
        con.query(`SELECT access_token FROM users WHERE userId = '${interaction.user.id}'`, async (err, result) => {
            if(err) console.log(err);
            if(result.length === 0){
                interaction.reply({
                    content: "You do not have a Google account linked to this bot!",
                    ephemeral: true
                });
            }
            else{
                revokeToken(result[0].access_token);
                con.query(`DELETE FROM users WHERE userId = '${interaction.user.id}'`, (err) => {
                    if (err) console.log(err)
                    interaction.reply({
                        content: "Google Authorization revoked!",
                        ephemeral: true
                    })
                })
            }
        })
    }
}