const Mongoose = require("mongoose");
const userSchema = require("../schemas/UserSchema");
const { extractUserIds } = require("./utility");

const AllTimeDB = Mongoose.connection.useDb("AllTimeDB");
const WeeklyDB = Mongoose.connection.useDb("WeeklyDB");

const AllTimeUser = AllTimeDB.model("User", userSchema);
const WeeklyUser = WeeklyDB.model("User", userSchema);

async function updateWeeklyDB(data) {
    const userData = {
        event: data.event,
        host: extractUserIds(data.host),
        cohost: extractUserIds(data.cohost),
        attendees: extractUserIds(data.attendees),
    };

    const now = new Date();
    try {
        await WeeklyUser.bulkWrite([
            { updateOne: {
                filter: { _id: userData.host[0] },
                update: { $inc: { hosted: 1 }},
                upsert: true
            }},
            ...userData.cohost.map(id => ({
                updateOne: {
                    filter: { _id: id },
                    update: { $inc: { cohosted: 1 }},
                    upsert: true
                }
            })),
            ...userData.attendees.map(id => ({
                updateOne: {
                    filter: { _id: id },
                    update: { $inc: { attended: 1 }},
                    upsert: true
                }
            }))
        ]);
    } catch(err) {
        throw err;
    }
}

async function rollWeeklyToAllTime() {
    try {
        const weeklyUsers = await WeeklyUser
            .find()
            .lean();

        if (weeklyUsers.length === 0) {
            console.log("No users found in WeeklyDB");
            return;
        }

        // Bulk operations for AllTimeDB
        const bulkOps = weeklyUsers.map(user => ({
            updateOne: {
                filter: { _id: user._id },
                update: {
                    $inc: {
                        hosted: user.hosted,
                        cohosted: user.cohosted,
                        attended: user.attended
                    },
                },
                upsert: true
            }
        }));

        await AllTimeUser.bulkWrite(bulkOps);
        console.log("AllTimeDB updated successfully");

        // Reset WeeklyDB
        const resetOps = weeklyUsers.map(user => ({
            updateOne: {
                filter: { _id: user._id },
                update: { $set: { hosted: 0, cohosted: 0, attended: 0 } }
            }
        }));

        await WeeklyUser.bulkWrite(resetOps);
        console.log("WeeklyDB reset successfully");
    } catch(err) {
        throw err;
    }
}

module.exports = { updateWeeklyDB, rollWeeklyToAllTime };