
const Mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");

const LogsModule = require("./logs");
const important = require("../configs/constants");
const userSchema =  require("../schemas/UserSchema");

const STAFF_ROLES = ["1364898392689606667"];
const EXCUSED_ROLES = ["1364068742077743284", "1319685397697007677", "1319685026446704732", "1382354473942388800"];

async function quotaReset(client) {
    console.log("Starting weekly reset...");
    try {
        const DB = Mongoose.connection.useDb("WeeklyDB");
        const WeeklyUser = DB.model("User", userSchema);

        // Get all users weekly data
        const cursor = WeeklyUser.find().cursor();
        const guild = await client.guilds.fetch(important.guildId);
        const announceChannel = await guild.channels.fetch(important.announceChannelId);
        const reportChannel = await guild.channels.fetch(important.reportChannelId);

        // Check quota
        let failedQuota = []
        for await (const user of cursor) {
            try {
                const member = await guild.members.fetch(user._id).catch(() => null);
                if (!member) continue;

                const isStaff = member.roles.cache
                    .filter(r => r && r.id)
                    .some(r => STAFF_ROLES.includes(r.id));
                const isExcused = member.roles.cache
                    .filter(r => r && r.id)
                    .some(r => EXCUSED_ROLES.includes(r.id));

                const hasHosted = user.hosted >= 1;
                const hasAttended = user.attended >= 1;

                const metQuota = isStaff ? (hasHosted || hasAttended) : hasAttended;

                if (!metQuota && !isExcused) {
                    const Reason = isStaff
                        ? "did not host or attend any events"
                        : "did not attend any events";

                    failedQuota.push({
                        id: user._id,
                        reason: Reason
                    });
                }
            } catch (memErr) {
                console.error(`Error while checking user ${user._id}`, memErr);
            }
        }

        // Display top 2 hosts and attendees
        const topHosts = await WeeklyUser.find()
            .sort({ hosted: -1})
            .limit(2)
            .lean();

        const topAttendees = await WeeklyUser.find()
            .sort({ attended: -1 })
            .limit(2)
            .lean();

        const topMembersEmbed = new EmbedBuilder()
            .setColor([128,0,128])
            .setTitle("Weekly Quota Reset")
            .addFields(
                { name: "Top Weekly Host", value: `The top host for this week goes to <@${topHosts[0]._id}> with ${topHosts[0].hosted} events hosted, followed by <@${topHosts[1]._id}> with ${topHosts[1].hosted} hosts!` },
                { name: "Top Weekly Attendee", value: `The top attendee for this week goes to <@${topAttendees[0]._id}> with ${topAttendees[0].attended} events attended, followed by <@${topAttendees[1]._id}> with ${topAttendees[1].attended} attendees!` }
            )
            .setFooter({ text: "Keep working hard, Heartkeepers" })
            .setTimestamp();

        await announceChannel.send({ embeds: [topMembersEmbed] });

        // Display failed quota list (if any)
        if (failedQuota.length > 0) {
            const failedList = failedQuota.map((u, i) => `**${i + 1}.** <@${u.id}> — ${u.reason}`).join("\n");
            const embed = new EmbedBuilder()
                .setColor([255, 0, 0])
                .setTitle(":warning: Failed Quota")
                .setDescription(failedList)
                .setTimestamp();

            await reportChannel.send({ embeds: [embed] });
            console.log(`[WEEKLY CHECK]: ${failedQuota.length} members did not meet quota`);
        } else {
            const embed = new EmbedBuilder()
                .setColor([0, 255, 0])
                .setTitle(":white_check_mark: Quota Complete")
                .setDescription("Everyone completed their quota!")
                .setTimestamp();

            await reportChannel.send({ embeds: [embed] });
            console.log("[WEEKLY CHECK]: All members met their quota this week!");
        }

        // Reset Weekly data
        await LogsModule.rollWeeklyToAllTime();
    } catch (err) {
        console.log("Error during weekly reset");
        throw err;
    }
}

module.exports = { quotaReset };