const Mongoose = require("mongoose");

const userSchema = new Mongoose.Schema({
    _id: String,
    hosted: { type: Number, default: 0 },
    cohosted: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
    strikes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = userSchema;