const http = require("http");
const url = require("url");
const destroyer = require("server-destroy");
const {firestore} = require("firebase-admin");
const express = require('express');
const timeout = require('connect-timeout');
const keys = require('../Creds/keys.json');
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

    getAuthTokens: function(oAuth2Client, app){
        return new Promise((resolve, reject) => {
            app.get('/api/auth/google/calendars/token', async function(request, response) {
                try{
                    if (request.url.indexOf('/api/auth/google/calendars/token') > -1) {
                        const qs = new url.URL(request.url, keys.web.redirect_uris[0]).searchParams;
                        const code = qs.get('code');
                        response.end('Authentication successful! You can now close this window.');

                        const r = await oAuth2Client.getToken(code);
                        let state = qs.get('state');
                        resolve([r.tokens, state])
                    }
                }catch(e){
                    console.log("Then WHAT?")
                    console.log(e)
                }
            })
        })
    },

    delFirebaseDocs: async function(path, db){
        let doc = await db.doc(path).get();
        let result = doc.data();

        if(result){
            for (const [key, value] of Object.entries(result)) {
                const res = await db.doc(path).update({
                    key: firestore.FieldValue.delete()
                });
            }
            db.doc(path).delete();
        }
    },

}