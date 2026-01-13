module.exports = {
    "event":        { optional: false, mentionsOnly: false },
    "host":         { optional: false, mentionsOnly: true },
    "cohost":      { optional: true, mentionsOnly: true },
    "attendees":    { optional: false, mentionsOnly: true },
    "notes":        { optional: true, mentionsOnly: false },
    "evidence":     { optional: true, mentionsOnly: false },
    "ping":         { optional: true, mentionsOnly: true }
};