
const Mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");

const important = require("../configs/constants");
const userSchema =  require("../schemas/UserSchema");

const STAFF_ROLES = ["1425112155291648010"];
const EXCUSED_ROLES = ["1425115939753562163"];

async function quotaReset(client) {
    console.log("Starting weekly reset...");
    try {
        const DB = Mongoose.connection.useDb("WeeklyDB");
        const WeeklyUser = DB.model("User", userSchema);

        // Get all users weekly data
        const cursor = WeeklyUser.find().cursor();
        const guild = await client.guilds.fetch(important.guildId);
        const logChannel = await guild.channels.cache.get(important.eventLogChannelId);

        // Check quota
        let failedQuota = []
        for await (const user of cursor) {
            try {
                const member = await guild.members.fetch(user._id).catch(() => null);
                if (!member) continue;

                const isStaff = member.roles.cache.some(r => STAFF_ROLES.includes(r.id));
                const isExcused = member.roles.cache.some(r => EXCUSED_ROLES.includes(r.id));


                const metQuota = isStaff
                    ? user.hosted >= 1
                    : user.attended >= 1;

                if (!metQuota && !isExcused) {
                    const Reason = isStaff
                        ? "did not host any events"
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

        // Display failed quota list (if any)
        if (failedQuota.length > 0) {
            const failedList = failedQuota.map((u, i) => `**${i + 1}.** <@${u.id}> — ${u.reason}`).join("\n");
            const embed = new EmbedBuilder()
                .setColor([255, 0, 0])
                .setTitle(":warning: Failed Quota")
                .setDescription(failedList)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
            console.log(`[WEEKLY CHECK]: ${failedQuota.length} members did not meet quota`);
        } else {
            const embed = new EmbedBuilder()
                .setColor([0, 255, 0])
                .setTitle(":white_check_mark: Quota Complete")
                .setDescription("Everyone completed their quota!")
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
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