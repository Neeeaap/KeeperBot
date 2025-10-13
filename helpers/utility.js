/*const Mongoose = require("mongoose");
const userSchema = require("../schemas/UserSchema");*/

const important = require("../configs/constants");

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|\*|__|~~|\|\|)(.*?)\1/g, "$2")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\\([*_~`[\]\\()])/g, "$1")
    .replace(/[\s\-]+/g, "")
    .trim();
}

function extractUserIds(mention) {
    if (!mention) return [];
    return [...mention.matchAll(/<@!?(\d+)>/g)].map(match => match[1]);
}

module.exports = { extractUserIds, stripMarkdown };