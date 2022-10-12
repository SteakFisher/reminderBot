const {firestore} = require("firebase-admin");
module.exports = {
    addReactor: async function(interaction, db){
        let doc = await db.doc(`guilds/${interaction.guild.id}`).get();
        let result = doc.data();
        console.log(await result)

        if(!result){
            db.doc(`guilds/${interaction.guild.id}`).set({
                [ interaction.message.id ] : [interaction.user.id]
            })
        }else{
            db.doc(`guilds/${interaction.guild.id}`).update({
                [ interaction.message.id ]: firestore.FieldValue.arrayUnion(interaction.user.id)
            })
        }
    }
}