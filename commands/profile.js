const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Mongoose = require ("mongoose");

const important = require("../configs/constants");
const userSchema = require("../schemas/UserSchema");

const activityLabels = {
    hosted: "Hosts",
    cohosted: "Co-Hosts",
    attended: "Attended"
};

const categoryLabels = {
    WeeklyDB: "Weekly",
    AllTimeDB: "All-Time"
};

async function displayProfile(member) {
    try {
        const AllTimeDB = Mongoose.connection.useDb("AllTimeDB");
        const WeeklyDB = Mongoose.connection.useDb("WeeklyDB");
        const WeeklyUser = WeeklyDB.model("User", userSchema);
        const AllTimeUser = AllTimeDB.model("User", userSchema);

        const [allTimeDoc, weeklyDoc] = await Promise.all([
            AllTimeUser.findOne({ _id: member.user.id }),
            WeeklyUser.findOne({ _id: member.user.id })
        ]);

        const allTimeStats = allTimeDoc || { hosted: 0, cohosted: 0, attended: 0 }
        const weeklyStats = weeklyDoc || { hosted: 0, cohosted: 0, attended: 0 }

        const embed = new EmbedBuilder()
            .setTitle(`${member.user.username}'s Profile`)
            .setDescription("Your performance as a Heartkeeper")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor([128,0,128])
            .addFields(
                { 
                    name: categoryLabels.WeeklyDB,
                    value: Object.entries(activityLabels).map(([key, label]) => `**${label}:** ${weeklyStats[key] ?? 0}`).join("\n"),
                    inline: true
                },
                {
                    name: categoryLabels.AllTimeDB,
                    value: Object.entries(activityLabels).map(([key, label]) => `**${label}:** ${allTimeStats[key] ?? 0}`).join("\n"),
                    inline: true
                }
            )
            .setTimestamp();

        return embed;
    } catch(err) {
        throw err;
    }
}

module.exports = {
    cooldown: 10,
    allowedRoles: ["1319685912229056592", "1425131169309265920"],
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Displays performance stats")
        .addUserOption((option) => 
            option
                .setName("member")
                .setDescription("Choose a member to check profile of")
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser("member") || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        if (member.user.bot) {
            await interaction.editReply("The user you specified is a bot, only humans are allowed");
            return;
        }

        try {
            let profile = await displayProfile(member);
            await interaction.editReply({ embeds: [ profile ] });
        } catch(err) {
            throw err;
        }
    }
}