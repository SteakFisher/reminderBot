const admin = require("firebase-admin");
const {getAuth} = require("firebase-admin/auth");
const {getDatabase} = require("firebase-admin/database");

module.exports = {
    setup: function (firebaseApp) {
        let firebaseAuth = getAuth(firebaseApp);
        let firebaseDatabase = getDatabase(firebaseApp);
    }
}