require("dotenv").config();

module.exports = {
    eventLogChannelId: process.env.CHANNEL_ID,
    mentionRegex: /^<@!?(\d+)>(?:\s*<@!?(\d+)>)*$/
};