const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Mongoose = require("mongoose");
const userSchema = require("../schemas/UserSchema");

const activityLabels = {
    hosted: "Hosts",
    cohosted: "Co-Hosts",
    attended: "Attendees"
};

const categoryLabels = {
    WeeklyDB: "Weekly",
    AllTimeDB: "All-Time"
};

async function compileToEmbed(category, activity, max, order) {
    try {
        const DB = Mongoose.connection.useDb(category);
        const User = DB.model("User", userSchema);

        const topMembers = await User.find()
            .sort({ [activity]: order || -1 })
            .limit(max || 10)
            .lean();

        if (topMembers.length === 0) return;

        const leaderboard = topMembers
            .map((u, i) => `**${i + 1}.** <@${u._id}> — ${u[activity]} events ${activity}`)
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor([128,0,128])
            .setTitle(`:trophy: Top ${categoryLabels[category]} ${activityLabels[activity]}`)
            .setDescription(leaderboard)

        return embed;
    } catch(err) {
        throw err;
    }
}

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Displays the most active members")
        .addStringOption((option) =>
            option
                .setName("category")
                .setDescription("Choose which leaderboard to view")
                .addChoices(
                    { name: "Weekly", value: "WeeklyDB" },
                    { name: "All Time", value: "AllTimeDB" }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("activity")
                .setDescription("Choose which type of activity to view")
                .addChoices(
                    { name: "Hosts", value: "hosted" },
                    { name: "Co-Hosts", value: "cohosted" },
                    { name: "Attendees", value: "attended" }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        const category = interaction.options.getString("category");
        const activity = interaction.options.getString("activity");
        await interaction.deferReply();

        try {
            let leaderboard = await compileToEmbed(category, activity)
            if (!leaderboard) {
                await interaction.editReply("No user data found to display leaderboard");
                return;
            }

            await interaction.editReply({ embeds: [ leaderboard ] });
        } catch(err) {
            throw err;
        }
    },

    compileToEmbed
};