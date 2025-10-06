const User = require("../models/User");
const { extractUserIds } = require("./utility");

// Formats and stores user data
async function updateUsers(data) {
    const userData = {
        event: data.event,
        host: extractUserIds(data.host),
        cohost: extractUserIds(data["co-host"]),
        attendees: extractUserIds(data.attendees),
    };

    const now = new Date();
    try {
        await User.bulkWrite([
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
        console.error("Failed to update data:", err);
    }
}

module.exports = { updateUsers };