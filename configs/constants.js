require("dotenv").config();

module.exports = {
    botToken: process.env.BOT_TOKEN,
    mongoURI: process.env.MONGO_URI,
    mongoDB_NAME: process.env.MONGO_DB_NAME,
    eventLogChannelId: process.env.CHANNEL_ID,
    mentionRegex: /^<@!?(\d+)>(?:\s*<@!?(\d+)>)*$/
};