require("dotenv").config();

const { Client, Events, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const eventLogChannelId = "1424080551609892934";

client.once(Events.ClientReady, readyClient => {
    console.log(`Client online, logged in as ${readyClient.user.tag}`)
});

client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    if (message.channel.id !== eventLogChannelId) return;

    console.log(message.content);
})

client.login(process.env.BOT_TOKEN);