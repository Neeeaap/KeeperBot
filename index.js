const { Client, Events, GatewayIntentBits } = require("discord.js");
const formatFields = require("./configs/fields");
const { eventLogChannelId, mentionRegex } = require("./configs/constants");
const { sendError, sendSuccess } = require("./helpers/embeds");
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Client online, logged in as ${readyClient.user.tag}`);
})

client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    if (message.channel.id !== eventLogChannelId) return;
    if (!message.content.toLowerCase().startsWith("event")) return;

    let content = message.content.trim();
    let lines = content.split("\n");
    let data = {};

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
        
        data[key] = info;
    }

    // Check for missing fields
    let missingFields = [];
    for (const field in formatFields) {
        let optionalField = formatFields[field].optional;
        let value = data[field];

        if (!optionalField && (!value || value.trim() === "")) {
            missingFields.push("`" + field + "`");
        }
    }

    if (missingFields.length > 0) {
        sendError(message, "Missing fields", `${missingFields.join(", ")}`)
        return;
    }

    // Store data
    sendSuccess(message, ":clipboard: Event successfully logged.")
})

client.login(process.env.BOT_TOKEN);