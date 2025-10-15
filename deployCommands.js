const { REST, Routes } = require("discord.js");
const { botToken } = require("./configs/constants");
const FS = require("node:fs");
const PATH = require("node:path");

const commands = [];
const commandsPath = PATH.join(__dirname, "commands");
const commandFiles = FS.readdirSync(commandsPath).filter(file => file.endsWith(".js") || file.endsWith(".ts"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (!command?.data) {
        console.error(`Command file ${file} is missing data`);
        continue;
    }
    commands.push(command.data.toJSON());
}

const rest = new REST().setToken(botToken);

async function start() {
    try {
        console.log("Refreshing application slash commands...");
        await rest.put(
            Routes.applicationCommands("1424083255619092671", "1319684991449563228"),
            { body: commands }
        );

        console.log("Successfully reloaded slash commands!");
    } catch(err) {
        console.log("Error while reloading slash commands:", err);
    }
};

start();