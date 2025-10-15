const { EmbedBuilder } = require("discord.js");

function sendError(message, title, description) {
    const embed = new EmbedBuilder()
        .setColor([255, 0, 0])
        .setTitle(title)
        .setDescription(description);
    return message.reply({ embeds: [embed] });
}

function sendSuccess(message, description) {
    const embed = new EmbedBuilder()
        .setColor([0, 255, 0])
        .setDescription(description)
        .setTimestamp();
    return message.reply({ embeds: [embed] });
}

module.exports = { sendError, sendSuccess };