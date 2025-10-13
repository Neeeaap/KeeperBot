const Mongoose = require("mongoose");
const { SlashCommandBuilder } = require("discord.js");

async function strike(member) {
    
}

module.exports = {
    cooldown: 5,
    allowedRoles: ["1425112155291648010", "1364898392689606667", "1319685026446704732", "1319685397697007677"],
    data: new SlashCommandBuilder()
        .setName("strike")
        .setDescription("Strike a specified member"),

    async execute(interaction) {
        try {
            
        } catch(err) {
            throw err;
        }
    }
}