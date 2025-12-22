const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js");
const { sendError, sendSuccess } = require("./helpers/embeds");

const Mongoose = require("mongoose");
const CRON = require("node-cron");
const FS = require("node:fs");
const PATH = require("node:path");
const formatFields = require("./configs/fields");
const important = require("./configs/constants");
const LogsModule = require("./helpers/logs");
const userSchema = require("./schemas/UserSchema");
const utility = require("./helpers/utility");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ] 
});

client.cooldowns = new Collection();
client.commands = new Collection();
const commandsPath = PATH.join(__dirname, "commands");
const commandsFiles = FS.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandsFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    if (message.channel.id !== important.eventLogChannelId) return;
    if (!utility.stripMarkdown(message.content).toLowerCase().startsWith("event")) return;

    let content = message.content.trim();
    let lines = content.split("\n");
    let rawData = {};

    for (const line of lines) {
        let [rawKey, ...value] = line.split(":");
        let key = utility.stripMarkdown(rawKey)?.toLowerCase();
        let info = value.join(":").trim();

        let field = formatFields[key];
        if (!field) continue;

        if (field.optional && !info) continue;

        // Sanitize input
        if (formatFields[key].mentionsOnly === true) {
            if (formatFields[key].optional && (!info || info.trim() === "")) continue;

            if (!info.match(important.mentionRegex)) {
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
    LogsModule.updateWeeklyDB(rawData)
        .then(() => {
            sendSuccess(message, ":clipboard: Event logged successfully");
        })
        .catch((error) => {
            console.error("updateWeeklyDB() failed:", error);
            sendError(message, "Error!", "There was a problem with updating weekly data");
        })
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Check if user has permission
    if (command.allowedRoles?.length) {
        const hasPerms = interaction.member.roles.cache.some(role =>
            command.allowedRoles.includes(role.id)
        );

        if (!hasPerms) {
            interaction.reply("You do not have permission to use this command");
            return;
        }
    }

    // Check for cooldown
    const { cooldowns } = interaction.client;
    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const remainingTime = (expirationTime - now) / 1000;
            const seconds = Math.floor(remainingTime % 60);
            const minutes = Math.floor((remainingTime / 60) % 60);

            const formatted = minutes > 0
                ? `${minutes}m ${seconds}s`
                : `${seconds}s`;

            interaction.reply(`Please wait, you are on a cooldown for \`/${command.data.name}\`. You can use it again in ${formatted}`);
            return;
        }
    }

    // Set cooldown
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
        await command.execute(interaction);
    } catch(err) {
        interaction.editReply("There was a problem while running the command");
        console.error(err)
    }
});

client.on(Events.GuildMemberUpdate, async(oldMember, newMember) => {
    if (newMember.user.bot) return;
    
    const hadRole = oldMember.roles.cache.has(important.memberId);
    const hasRole = newMember.roles.cache.has(important.memberId);

    const AllTimeDB = Mongoose.connection.useDb("AllTimeDB");
    const WeeklyDB = Mongoose.connection.useDb("WeeklyDB");
    const WeeklyUser = WeeklyDB.model("User", userSchema);
    const AllTimeUser = AllTimeDB.model("User", userSchema);

    // New member
    if (!hadRole && hasRole) {
        console.log(`New member: ${newMember.user.tag} detected, issuing new document...`);
        try {
            await WeeklyUser.updateOne(
                { _id: newMember.user.id },
                { $setOnInsert: {
                    hosted: 0,
                    cohosted: 0,
                    attended: 0,
                    strikes: 0,
                }},
                { upsert: true }
            );
            console.log(`Created new document for ${newMember.user.tag} with Id: ${newMember.user.id}`);
        } catch(err) {
            console.error("An error occurred while creating document:", err);
        }
    } else if (hadRole && !hasRole) {
        // Member left
        console.log(`Member left: ${newMember.user.tag}, removing document from database...`);
        try {
            await Promise.all([
                WeeklyUser.deleteOne({ _id: newMember.user.id }),
                AllTimeUser.deleteOne({ _id: newMember.user.id })
            ]);
            console.log(`Removed member ${newMember.user.tag} from database with Id: ${newMember.user.id}`);
        } catch(err) {
            console.error("An error occurred while removing document:", err);
        }
    }
});

client.on(Events.GuildMemberRemove, async (member) => {
    if (member.user.bot) return;

    const AllTimeDB = Mongoose.connection.useDb("AllTimeDB");
    const WeeklyDB = Mongoose.connection.useDb("WeeklyDB");
    const WeeklyUser = WeeklyDB.model("User", userSchema);
    const AllTimeUser = AllTimeDB.model("User", userSchema);

    const isMember = member.roles.cache.has(important.memberId);
    if (isMember) {
        console.log(`Member ${member.user.tag} left the server, removing document from database...`)
        try {
            await Promise.all([
                WeeklyUser.deleteOne({ _id: member.user.id }),
                AllTimeUser.deleteOne({ _id: member.user.id })
            ]);
            console.log(`Removed member ${member.user.tag} from database with Id: ${member.user.id}`);
        } catch(err) {
            console.error("An error occurred while removing document:", err);
        }
    }
})

// Weekly quota reset
if (!global.hasCronStarted) {
    CRON.schedule("0 0 * * 1", async() => {
        try {
            await require("./helpers/reset").quotaReset(client);
            console.log("Weekly reset successful");
        } catch(err) {
            console.log("An error occured while resetting quota:", err);
        }
    }, { timezone: "Asia/Singapore" });

    global.hasCronStarted = true;
    console.log("Cron scheduled");
}

async function start() {
    try {
        await Mongoose.connect(important.mongoURI);
        console.log("Connected to MongoDB");

        await client.login(important.botToken);
        console.log(`Logged in as ${client.user.tag}`);

        const channelToSend = await client.channels.fetch("1424080551609892934");

        const messageEmbed = new EmbedBuilder()
            .setColor([247, 239, 118])
            .setTitle(":purple_heart: No-Quota Week :purple_heart:")
            .setDescription("As mentioned in the last guild ceremony, everyone is immune from quota for the week. If you have any guild strikes, you can still get them removed by hosting or attending 1 event.\n\n**Merry Christmas, Happy New Year, and go TOUCH GRASS!!** :tada:");

        if (channelToSend) await channelToSend.send({ embeds: [messageEmbed] });

       //require("./initDatabase").initDB(client);
       //await require("./helpers/reset").quotaReset(client);
    } catch(err) {
        console.error("Failed to start:", err)
        process.exit(1);
    }
}

start();