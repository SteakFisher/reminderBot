const http = require("http");
const url = require("url");
const destroyer = require("server-destroy");

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
                        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
                        const code = qs.get('code');
                        res.end('Authentication successful! You can now close this window.');
                        server.close();

                        const r = await oAuth2Client.getToken(code);
                        resolve([r])
                    }
                } catch(err) {
                    console.log(err);
                }
            }).listen(3000, () => {
                console.log('listening on port 3000');
            })
            destroyer(server);
        })
    },

    sqlSetup: function(con){
        con.connect(function(err) {
            if (err) console.log(err);
            console.log("Connected!");
        });

        con.query("CREATE DATABASE IF NOT EXISTS reminderBot", (err, result) => {
            if(err) console.log(err)
            console.log("Database created");
        })
        con.query("USE reminderBot", (err, result) => {
            if(err) console.log(err)
            console.log("Database selected");
        })
        con.query("CREATE TABLE IF NOT EXISTS reminders (id INT AUTO_INCREMENT PRIMARY KEY, messageId VARCHAR(30) UNIQUE, guildId VARCHAR(30), title varchar(255), startDate DATETIME, endDate DATETIME)", (err, result) => {
            if(err) console.log(err)
            console.log("Table created");
        })
        con.query("CREATE TABLE IF NOT EXISTS users (userId VARCHAR(30) PRIMARY KEY, access_token VARCHAR(255), refresh_token VARCHAR(255), expiry_date BIGINT)", (err, result) => {
            if(err) console.log(err)
            console.log("Table created");
        })
    }
}