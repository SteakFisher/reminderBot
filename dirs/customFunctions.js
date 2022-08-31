const http = require("http");
const url = require("url");
const destroyer = require("server-destroy");
const {firestore} = require("firebase-admin");
const express = require('express');
const timeout = require('connect-timeout');
let serverOpen = false;

module.exports = {
    timeChecks: function(dateAndTime){
        let date = dateAndTime.split(" ")[0].split("-")
        let time = dateAndTime.split(" ")[1].split(":")

        let d1 = [parseInt(date[0]), parseInt(date[1]), parseInt(
            date[2]), parseInt(time[0]), parseInt(time[1]), parseInt(time[2])]

        for(let i = 0; i < d1.length; i++){
            if(isNaN(d1[i])){
                throw new Error("Invalid date or time")
            }
        }
    },

    getServerState: function(){
        return serverOpen;
    },

    getAuthTokens: function(oAuth2Client){
        let app = express()
        return new Promise((resolve, reject) => {
            app.set('port', (process.env.PORT || 5000));
            app.get('/api/auth/google/calendars/token', async function(request, response) {
                try{
                    if (request.url.indexOf('/api/auth/google/calendars/token') > -1) {
                        const qs = new url.URL(request.url, 'https://remindbotsteak.herokuapp.com:443/api/auth/google/calendars/token').searchParams;
                        const code = qs.get('code');
                        response.end('Authentication successful! You can now close this window.');

                        const r = await oAuth2Client.getToken(code);
                        let state = qs.get('state');
                        resolve([r, state])
                    }
                }catch(e){
                    console.log(e)
                }
            })

            if(!serverOpen){
                app.listen(process.env.PORT || 443, function() {
                    console.log('App is running, server is listening on port ', app.get('port'));
                    serverOpen = true;
                });
            }
        })
    },

    delFirebaseDocs: async function(path, db){
        let doc = await db.doc(path).get();
        let result = doc.data();

        for (const [key, value] of Object.entries(result)) {
            const res = await db.doc(path).update({
                key: firestore.FieldValue.delete()
            });
        }
        db.doc(path).delete();
    },

}