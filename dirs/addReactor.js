const {firestore} = require("firebase-admin");
module.exports = {
    addReactor: async function(interaction, db){
        let doc = await db.doc(`reminders/${interaction.user.id}`).get();
        let result = doc.data();

        if(!result){
            db.doc(`guilds/${interaction.guild.id}`).set({
                reactors: [interaction.user.id]
            })
        }else{
            db.doc(`guilds/${interaction.guild.id}`).update({
                reactors: firestore.FieldValue.arrayUnion(interaction.user.id)
            })
        }
    }
}