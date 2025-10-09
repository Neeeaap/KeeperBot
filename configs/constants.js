require("dotenv").config();

module.exports = {
    botToken: process.env.BOT_TOKEN,
    mongoURI: process.env.MONGO_URI,
    mongoDB_NAME: process.env.MONGO_DB_NAME,
    eventLogChannelId: process.env.EVENTLOGS_ID,
    reportChannelId: process.env.REPORTLOGS_ID,
    announceChannelId: process.env.ANNOUNCE_ID,
    clientId: process.env.CLIENT_ID,
    memberId: process.env.MEMBER_ID,
    guildId: process.env.GUILD_ID,
    mentionRegex: /<@!?(\d+)>|<@&(\d+)>/g
};