const Mongoose = require("mongoose");

const userSchema = new Mongoose.Schema({
    _id: String,
    hosted: { type: Number, default: 0 },
    cohosted: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.index({ hosted: -1, attended: -1 });
module.exports = Mongoose.model("User", userSchema);