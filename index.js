const { Client, Events, GatewayIntentBits } = require("discord.js");
const formatFields = require("./configs/fields");
const { botToken, mongoURI, eventLogChannelId, mentionRegex } = require("./configs/constants");
const { sendError, sendSuccess } = require("./helpers/embeds");
const { updateUsers } = require("./helpers/logs");

const Mongoose = require("mongoose");
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    if (message.channel.id !== eventLogChannelId) return;
    if (!message.content.toLowerCase().startsWith("event")) return;

    let content = message.content.trim();
    let lines = content.split("\n");
    let rawData = {};

    for (const line of lines) {
        let [rawKey, ...value] = line.split(":");
        let key = rawKey?.trim().toLowerCase();
        let info = value.join(":").trim();

        let field = formatFields[key];
        if (!field) continue;

        if (field.optional && !info) continue;

        // Sanitize input
        if (formatFields[key].mentionsOnly === true) {
            if (formatFields[key].optional && (!info || info.trim() === "")) continue;

            if (!mentionRegex.test(info)) {
                sendError(message, `Invalid ${key} input`, `You must include valid mentions under **${key}**`);
                return;
            }
        }   
        
        rawData[key] = info;
    }

    // Check for missing fields
    let missingFields = [];
    for (const field in formatFields) {
        let optionalField = formatFields[field].optional;
        let value = rawData[field];

        if (!optionalField && (!value || value.trim() === "")) {
            missingFields.push("`" + field + "`");
        }
    }

    if (missingFields.length > 0) {
        sendError(message, "Missing fields", `${missingFields.join(", ")}`)
        return;
    }

    // Store data
    updateUsers(rawData);
})

async function start() {
    try {
        await Mongoose.connect(mongoURI, {
            dbName: "EventLogs"
        });
        console.log("Connected to MongoDB");

        await client.login(botToken);
        console.log(`Logged in as ${client.user.tag}`);
    } catch(err) {
        console.error("Failed to start:", err)
        process.exit(1);
    }
}

start();