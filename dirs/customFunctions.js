const http = require("http");
const url = require("url");
const destroyer = require("server-destroy");
const {firestore} = require("firebase-admin");

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

    getAuthTokens: function(oAuth2Client){
        return new Promise((resolve, reject) => {
            const server = http.createServer(async (req, res) =>{
                try {
                    if (req.url.indexOf('/api/auth/google/calendars/token') > -1) {
                        const qs = new url.URL(req.url, 'https://remindbotsteak.herokuapp.com:443/api/auth/google/calendars/token').searchParams;
                        const code = qs.get('code');
                        res.end('Authentication successful! You can now close this window.');
                        server.close();

                        const r = await oAuth2Client.getToken(code);
                        resolve([r])
                    }
                } catch(err) {
                    console.log(err);
                }
            }).listen(process.env.PORT || 443, () => {
                console.log(`listening on port 3000 ${process.env.PORT}`);
                console.log()
            })
            destroyer(server);
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