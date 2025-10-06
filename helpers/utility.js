function extractUserIds(mention) {
    if (!mention) return [];
    return [...mention.matchAll(/<@!?(\d+)>/g)].map(match => match[1]);
}

module.exports = { extractUserIds };