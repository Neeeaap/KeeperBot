const Mongoose = require("mongoose");
const { SlashCommandBuilder } = require("discord.js");
const userSchema = require("../schemas/UserSchema");

const important = require("../configs/constants");

module.exports = {
    cooldown: 5,
    allowedRoles: ["1425112155291648010", "1364898392689606667", "1319685026446704732", "1319685397697007677"],
    data: new SlashCommandBuilder()
        .setName("modify")
        .setDescription("Modify a specified user's data")
        .addUserOption((option) => 
            option
                .setName("member")
                .setDescription("Choose a member to modify data of")
                .setRequired(true)
        )
        .addStringOption((option) => 
            option
                .setName("category")
                .setDescription("Choose which data to modify")
                .addChoices(
                    { name: "Hosts", value: "hosted" },
                    { name: "Co-Hosts", value: "cohosted" },
                    { name: "Attendees", value: "attended" }
                )
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount to increment their data by")
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("member");
        const category = interaction.options.getString("category");
        const amount = interaction.options.getInteger("amount");
        const member = await interaction.guild.members.fetch(user.id);
        await interaction.deferReply();

        if (member.user.bot) {
            await interaction.editReply("The user you specified is a bot, only humans are allowed");
            return;
        }

        const isMember = member.roles.cache.has(important.memberId);
        if (!isMember) {
            await interaction.editReply("The user you specified is not a Heartkeeper, only those who serve may exist in the database")
            return;
        }

        try {
            const WeeklyDB = Mongoose.connection.useDb("WeeklyDB");
            const WeeklyUser = WeeklyDB.model("User", userSchema);

            await WeeklyUser.updateOne(
                { _id: member.user.id },
                { $inc: { [category]: amount } },
                { upsert: true }
            )

            interaction.editReply(`Successfully incremented ${member.user.username}'s ${category} amount by ${amount}`);
        } catch(err) {
            throw err;
        }
    }
}