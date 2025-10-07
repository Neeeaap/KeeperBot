/*const Mongoose = require("mongoose");
const userSchema = require("../schemas/UserSchema");*/

const important = require("../configs/constants");

/*async function initDatabase() {
    try {
        await Mongoose.connect(important.mongoURI);
        console.log("Connected to MongoDB")

        const AllTimeDB = Mongoose.connection.useDb("AllTimeDB");
        const WeeklyDB = Mongoose.connection.useDb("WeeklyDB");
        const WeeklyUser = WeeklyDB.model("User", userSchema);
        const AllTimeUser = AllTimeDB.model("User", userSchema);

        return { WeeklyUser, AllTimeUser };
    } catch(err) {
        throw err;
    }
}*/

function extractUserIds(mention) {
    if (!mention) return [];
    return [...mention.matchAll(/<@!?(\d+)>/g)].map(match => match[1]);
}

module.exports = { extractUserIds };