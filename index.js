require("dotenv").config();

const { Client, Events, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const eventLogChannelId = process.env.CHANNEL_ID;

const formatFields = {
    "event": { optional: false },
    "host": { optional: false },
    "co-host": { optional: true },
    "attendees": { optional: false },
    "notes": { optional: true },
    "evidence": { optional: true },
    "ping": { optional: false }
};

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

        if (!key || !(key in formatFields)) {
            continue;
        } else {
            let info = value.join(":").trim();
            data[key] = info;
        }
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
        let embed = new EmbedBuilder()
            .setColor([255,0,0])
            .setTitle("Missing fields")
            .setDescription(`${missingFields.join(", ")}`)

        message.reply({ embeds: [embed] });
        return;
    }

    // Store data
    let embed = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription(":clipboard: Event successfully logged.")
        .setTimestamp();

    message.reply({ embeds: [embed] });
})

client.login(process.env.BOT_TOKEN);