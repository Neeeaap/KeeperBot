const Mongoose = require("mongoose");
const userSchema = require("./schemas/UserSchema");
const important = require("./configs/constants");

async function initDB(client) {
    const guild = await client.guilds.fetch(important.guildId);
    await guild.members.fetch();

    const WeeklyDB = Mongoose.connection.useDb("WeeklyDB");
    const WeeklyUser = WeeklyDB.model("User", userSchema);

    // Prepare bulk operations
    const operations = [];

    for (const member of guild.members.cache.values()) {
        if (member.user.bot) continue;

        const isMember = member.roles.cache.has(important.memberId);
        if (!isMember) continue;

        operations.push({
            updateOne: {
                filter: { _id: member.user.id },
                update: {
                    $setOnInsert: {
                        hosted: 0,
                        cohosted: 0,
                        attended: 0,
                        strikes: 0
                    }
                },
                upsert: true
            }
        });
    }

    if (operations.length > 0) {
        try {
            const result = await WeeklyUser.bulkWrite(operations);
            console.log(`Database initialized: ${result.upsertedCount} new members, ${result.modifiedCount} updated`);
        } catch(err) {
            console.error("Error performing bulkWrite:", err);
            throw err;
        }
    }
}

module.exports = { initDB };