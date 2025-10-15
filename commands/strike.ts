import Mongoose from "mongoose";
import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, Guild } from "discord.js";

import important from "../configs/constants.js";
import userSchema from "../schemas/UserSchema.js";

const strikeIds = [
    "1367413785026887752", // Guild Strike 1
    "1367413788034334794", // Guild Strike 2
    "1385611642187939902" // Guild Strike 3 (Removal)
];

export async function strike(members: GuildMember | GuildMember[], amount: number) {
    try {
        const memberList = Array.isArray(members) ? members : [members];

        const AllTimeDB = Mongoose.connection.useDb("AllTimeDB");
        const AllTimeUser = AllTimeDB.model("User", userSchema);

        await Promise.all(
            memberList.map(async (member) => {
                // Get current strikes
                const userData = await AllTimeUser.findById(member.user.id);
                const currentStrikes = userData?.strikes ?? 0;

                // Clamp strike between 0-3
                const newStrikes = Math.max(0, Math.min(currentStrikes + amount, 3));

                // Update DB
                await AllTimeUser.updateOne(
                    { _id: member.user.id },
                    { $set: { strikes: newStrikes } },
                    { upsert: true }
                );

                // Update member roles
                await member.roles.remove(strikeIds).catch(() => {});
                if (newStrikes > 0 && newStrikes <= 3) {
                    await member.roles.add(strikeIds[newStrikes - 1]!).catch(() => {});
                }
            })
        );
    } catch(err) {
        throw err;
    }
}

export const cooldown = 5;
export const allowedRoles = ["1425112155291648010", "1364898392689606667", "1319685026446704732", "1319685397697007677"];
export const data = new SlashCommandBuilder()
    .setName("strike")
    .setDescription("Increment a specified member's strike count")
    .addUserOption((option) =>
        option
            .setName("member")
            .setDescription("The member to strike")
            .setRequired(true)
    )
    .addIntegerOption((option) => 
        option
            .setName("amount")
            .setDescription("The amount of strikes")
            .setMaxValue(3)
            .setMinValue(-3)
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount");
    await interaction.deferReply();

    if (!amount) {
        await interaction.editReply("Please specify strike amount");
        return;
    }

    if (!interaction.guild) {
        await interaction.editReply("This command can only be used inside a server");
        return;
    }

    const user = interaction.options.getUser("member");
    if (!user) return;

    const member = await interaction.guild.members.fetch(user.id);
    const isMember = member.roles.cache.has(important.memberId!);
    if (!isMember) {
        interaction.editReply("You can only configure strikes for Heartkeeper members");
        return;
    }

    try {
        await strike(member, amount);
        interaction.editReply(`Successfully incremented ${member.user.username}'s strike count by ${amount}`);
        console.log(`STRIKE COMMAND: ${interaction.member?.user.username} (${interaction.member?.user.id}) incremented ${member.user.username}'s (${member.user.id}) strike count by ${amount}`);
    } catch(err) {
        throw err;
    }
}